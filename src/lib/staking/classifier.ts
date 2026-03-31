/**
 * Classifies a NormalizedTx into a staking action type.
 *
 * Classification priority (highest → lowest):
 * 1. Decoded method name (Blockscout decoded ABI)
 * 2. Method ID 4-byte lookup
 * 3. Event log topic0
 * 4. ERC20 token transfer direction (KEY: "based" and similar staking tokens)
 * 5. Value/transfer flow heuristics
 * 6. Known staking contract address
 * 7. Keyword scan on method name
 * 8. Fallback → non_staking
 *
 * Token symbol resolution priority:
 * 1. Largest ERC20 token transfer (captures "based", "stHYPE", etc.)
 * 2. Native gas token (HYPE or configured nativeSymbol)
 */

import type { NormalizedTx, ClassifiedStakingAction, ActionType, ConfidenceLevel } from "./types";
import { DASHBOARD_CONFIG } from "@/config/dashboard";
import {
  KNOWN_METHOD_SIGNATURES,
  KNOWN_EVENT_TOPICS,
  METHOD_TO_ACTION,
  EVENT_TO_ACTION,
  STAKING_KEYWORDS,
} from "@/config/classifier";
import { weiToFormatted } from "@/lib/utils/amount";
import { normalizeAddress, isSameAddress, isEmptyCalldata } from "@/lib/utils/tx";
import type { TokenTransfer } from "./types";

const { nativeDecimals, nativeSymbol, stakingTokenSymbol, knownStakingContracts, targetAddress } =
  DASHBOARD_CONFIG;

const TARGET = normalizeAddress(targetAddress);
const KNOWN_STAKING = new Set(
  knownStakingContracts.map((a) => normalizeAddress(a))
);

// ─────────────────────────────────────────────
// Public classifier
// ─────────────────────────────────────────────

export function classifyTransaction(tx: NormalizedTx): ClassifiedStakingAction {
  const result =
    tryMethodNameClassify(tx) ??
    tryMethodIdClassify(tx) ??
    tryEventLogClassify(tx) ??
    tryTokenTransferClassify(tx) ??   // ← ERC20 transfer direction heuristic
    tryValueFlowClassify(tx) ??
    tryKnownContractClassify(tx) ??
    tryKeywordClassify(tx) ??
    fallbackClassify(tx);

  const { amountWei, tokenSymbol } = resolveAmount(tx, result.actionType);

  return {
    tx,
    actionType: result.actionType,
    amount: weiToFormatted(amountWei, nativeDecimals, tokenSymbol),
    amountWei,
    tokenSymbol,
    status: tx.status === "ok" ? "ok" : tx.status === "error" ? "error" : "pending",
    confidence: result.confidence,
    classifierReason: result.reason,
    parserSource: result.parserSource,
    contractAddress: tx.to ?? null,
  };
}

export function classifyTransactions(txs: NormalizedTx[]): ClassifiedStakingAction[] {
  return txs.map(classifyTransaction);
}

// ─────────────────────────────────────────────
// Classification strategies
// ─────────────────────────────────────────────

interface ClassifyResult {
  actionType: ActionType;
  confidence: ConfidenceLevel;
  reason: string;
  parserSource: ClassifiedStakingAction["parserSource"];
}

/** Strategy 1: decoded method name from Blockscout */
function tryMethodNameClassify(tx: NormalizedTx): ClassifyResult | null {
  const method = tx.method?.toLowerCase().trim();
  if (!method) return null;
  const action = METHOD_TO_ACTION[method] as ActionType | undefined;
  if (!action) return null;
  return {
    actionType: action,
    confidence: "high",
    reason: `Decoded method name: "${tx.method}"`,
    parserSource: "method_name",
  };
}

/** Strategy 2: method ID 4-byte lookup */
function tryMethodIdClassify(tx: NormalizedTx): ClassifyResult | null {
  if (!tx.methodId) return null;
  const sig = KNOWN_METHOD_SIGNATURES[tx.methodId];
  if (!sig) return null;
  const methodName = sig.split("(")[0].toLowerCase();
  const action = METHOD_TO_ACTION[methodName] as ActionType | undefined;
  if (!action) return null;
  return {
    actionType: action,
    confidence: "high",
    reason: `Method ID ${tx.methodId} → ${sig}`,
    parserSource: "method_id",
  };
}

/** Strategy 3: event log topic0 scan */
function tryEventLogClassify(tx: NormalizedTx): ClassifyResult | null {
  for (const log of tx.logs) {
    const topic0 = log.topics[0]?.toLowerCase();
    if (!topic0) continue;
    const eventSig = KNOWN_EVENT_TOPICS[topic0];
    if (!eventSig) continue;
    const eventName = eventSig.toLowerCase();
    const action = EVENT_TO_ACTION[eventName] as ActionType | undefined;
    if (!action) continue;
    return {
      actionType: action,
      confidence: "medium",
      reason: `Event topic0 match: ${eventSig}`,
      parserSource: "event_log",
    };
  }
  return null;
}

/**
 * Strategy 4: ERC20 token transfer direction heuristic.
 *
 * This catches ERC20-based staking (e.g. "based" token) where:
 * - target sends ERC20 OUT to a contract = stake/deposit
 * - target receives ERC20 IN from a contract (no matching out) = claim/withdrawal
 *
 * Only applies when there are token transfers and calldata is present
 * (distinguishing from simple token transfers).
 */
function tryTokenTransferClassify(tx: NormalizedTx): ClassifyResult | null {
  if (tx.tokenTransfers.length === 0) return null;

  const outTransfers = tx.tokenTransfers.filter((t) => t.direction === "out");
  const inTransfers = tx.tokenTransfers.filter((t) => t.direction === "in");

  // If configured staking token matches, higher confidence
  const primaryOut = getLargestTransfer(outTransfers);
  const primaryIn = getLargestTransfer(inTransfers);

  const isStakingToken = (t: TokenTransfer | null) =>
    t !== null &&
    stakingTokenSymbol !== null &&
    (t.tokenSymbol?.toLowerCase() === stakingTokenSymbol.toLowerCase());

  // ERC20 sent OUT during a contract call = stake/deposit
  if (primaryOut && !isEmptyCalldata(tx.rawInput)) {
    const isKnownStakingTok = isStakingToken(primaryOut);
    return {
      actionType: "stake",
      confidence: isKnownStakingTok ? "high" : "medium",
      reason: `ERC20 token "${primaryOut.tokenSymbol}" sent out to contract${isKnownStakingTok ? " (configured staking token)" : ""}`,
      parserSource: "value_flow",
    };
  }

  // ERC20 received IN from a contract = claim/withdrawal
  if (primaryIn && !primaryOut && !isEmptyCalldata(tx.rawInput)) {
    const isKnownStakingTok = isStakingToken(primaryIn);
    return {
      actionType: "unstake_claim",
      confidence: isKnownStakingTok ? "high" : "medium",
      reason: `ERC20 token "${primaryIn.tokenSymbol}" received from contract${isKnownStakingTok ? " (configured staking token)" : ""}`,
      parserSource: "value_flow",
    };
  }

  return null;
}

/** Strategy 5: native value flow heuristic */
function tryValueFlowClassify(tx: NormalizedTx): ClassifyResult | null {
  const to = tx.to ?? "";
  const from = tx.from;
  const hasValue = BigInt(tx.value ?? "0") > 0n;

  if (
    isSameAddress(from, TARGET) &&
    to !== TARGET &&
    hasValue &&
    isEmptyCalldata(tx.rawInput) &&
    !isKnownNonStaking(to)
  ) {
    return {
      actionType: "staking_related_unknown",
      confidence: "low",
      reason: "Native value sent to contract with no calldata; could be stake",
      parserSource: "value_flow",
    };
  }

  if (
    isSameAddress(to, TARGET) &&
    from !== TARGET &&
    hasValue &&
    isEmptyCalldata(tx.rawInput)
  ) {
    return {
      actionType: "staking_related_unknown",
      confidence: "low",
      reason: "Native value received from contract; could be unstake claim",
      parserSource: "value_flow",
    };
  }

  return null;
}

/** Strategy 6: known staking contract address */
function tryKnownContractClassify(tx: NormalizedTx): ClassifyResult | null {
  const to = normalizeAddress(tx.to ?? "");
  if (!KNOWN_STAKING.has(to)) return null;
  return {
    actionType: "staking_related_unknown",
    confidence: "medium",
    reason: `Interaction with known staking contract ${to}`,
    parserSource: "heuristic",
  };
}

/** Strategy 7: keyword scan on method name */
function tryKeywordClassify(tx: NormalizedTx): ClassifyResult | null {
  const method = (tx.method ?? "").toLowerCase();
  if (!method) return null;
  for (const keyword of STAKING_KEYWORDS) {
    if (method.includes(keyword)) {
      return {
        actionType: guessActionFromKeyword(keyword),
        confidence: "low",
        reason: `Method name contains staking keyword: "${keyword}"`,
        parserSource: "heuristic",
      };
    }
  }
  return null;
}

/** Fallback */
function fallbackClassify(tx: NormalizedTx): ClassifyResult {
  if (
    isSameAddress(tx.from, TARGET) &&
    BigInt(tx.value ?? "0") === 0n &&
    tx.to
  ) {
    return {
      actionType: "non_staking",
      confidence: "high",
      reason: "Zero-value contract call; no staking pattern matched",
      parserSource: "unknown",
    };
  }
  return {
    actionType: "non_staking",
    confidence: "medium",
    reason: "No staking pattern matched",
    parserSource: "unknown",
  };
}

// ─────────────────────────────────────────────
// Amount resolution
// ─────────────────────────────────────────────

/**
 * Resolves the primary staking amount and token symbol.
 *
 * Priority:
 * 1. Largest ERC20 token transfer in the relevant direction
 *    (captures "based", "stHYPE", or any ERC20 staking token)
 * 2. Native gas value as fallback
 */
function resolveAmount(
  tx: NormalizedTx,
  actionType: ActionType
): { amountWei: string; tokenSymbol: string } {
  const outTransfers = tx.tokenTransfers.filter((t) => t.direction === "out");
  const inTransfers = tx.tokenTransfers.filter((t) => t.direction === "in");

  // For stake/unstake_request: look at outgoing transfers first
  if (actionType === "stake" || actionType === "unstake_request" || actionType === "restake") {
    const largest = getLargestTransfer(outTransfers);
    if (largest && BigInt(largest.rawAmount) > 0n) {
      return {
        amountWei: largest.rawAmount,
        tokenSymbol: largest.tokenSymbol ?? nativeSymbol,
      };
    }
    // If no outgoing ERC20, check if any transfer with staking token symbol exists
    const anyStaking = tx.tokenTransfers.find(
      (t) => stakingTokenSymbol && t.tokenSymbol?.toLowerCase() === stakingTokenSymbol.toLowerCase()
    );
    if (anyStaking) {
      return { amountWei: anyStaking.rawAmount, tokenSymbol: anyStaking.tokenSymbol ?? nativeSymbol };
    }
  }

  // For claim/withdrawal: look at incoming transfers
  if (actionType === "unstake_claim" || actionType === "withdraw" || actionType === "reward_claim") {
    const largest = getLargestTransfer(inTransfers);
    if (largest && BigInt(largest.rawAmount) > 0n) {
      return {
        amountWei: largest.rawAmount,
        tokenSymbol: largest.tokenSymbol ?? nativeSymbol,
      };
    }
  }

  // For unknown staking actions: use largest transfer of any direction
  if (actionType === "staking_related_unknown") {
    const allTransfers = tx.tokenTransfers;
    const largest = getLargestTransfer(allTransfers);
    if (largest && BigInt(largest.rawAmount) > 0n) {
      return {
        amountWei: largest.rawAmount,
        tokenSymbol: largest.tokenSymbol ?? nativeSymbol,
      };
    }
  }

  // Fallback: native gas value
  return { amountWei: tx.value ?? "0", tokenSymbol: nativeSymbol };
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function getLargestTransfer(transfers: TokenTransfer[]): TokenTransfer | null {
  if (transfers.length === 0) return null;
  return transfers.reduce((a, b) => {
    try {
      return BigInt(a.rawAmount) >= BigInt(b.rawAmount) ? a : b;
    } catch {
      return a;
    }
  });
}

function guessActionFromKeyword(keyword: string): ActionType {
  if (["stake", "delegate", "deposit"].includes(keyword)) return "stake";
  if (["unstake", "unbond", "undelegate"].includes(keyword)) return "unstake_request";
  if (["claim", "harvest", "reward"].includes(keyword)) return "reward_claim";
  if (["withdrawal"].includes(keyword)) return "unstake_claim";
  if (["redelegate"].includes(keyword)) return "redelegate";
  return "staking_related_unknown";
}

const KNOWN_NON_STAKING = new Set<string>([]);

function isKnownNonStaking(addr: string): boolean {
  return KNOWN_NON_STAKING.has(normalizeAddress(addr));
}

// ─────────────────────────────────────────────
// Auto-detect dominant staking token from actions
// ─────────────────────────────────────────────

/**
 * Scans all classified actions and returns the most common ERC20 token symbol
 * found in staking-related transactions. Useful for showing the correct token
 * in summary cards when the staking token is ERC20 (e.g. "based").
 */
export function detectDominantStakingToken(
  actions: ClassifiedStakingAction[]
): string {
  if (stakingTokenSymbol) return stakingTokenSymbol;

  const counts: Record<string, number> = {};
  for (const a of actions) {
    if (a.actionType === "non_staking") continue;
    if (a.tokenSymbol && a.tokenSymbol !== nativeSymbol) {
      counts[a.tokenSymbol] = (counts[a.tokenSymbol] ?? 0) + 1;
    }
  }

  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return sorted.length > 0 ? sorted[0][0] : nativeSymbol;
}
