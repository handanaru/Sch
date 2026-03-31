/**
 * Classifies a NormalizedTx into a staking action type.
 *
 * Classification priority (highest → lowest):
 * 1. Decoded method name (if Blockscout decoded the ABI)
 * 2. Method ID lookup against known signatures
 * 3. Event log topic0 lookup
 * 4. Value/transfer flow heuristics
 * 5. Contract address heuristic (known staking contracts)
 * 6. Keyword scan on method name
 * 7. Fallback → non_staking
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
import { normalizeAddress, isSameAddress } from "@/lib/utils/tx";
import { isEmptyCalldata } from "@/lib/utils/tx";

const { nativeDecimals, nativeSymbol, knownStakingContracts, targetAddress } =
  DASHBOARD_CONFIG;

const TARGET = normalizeAddress(targetAddress);
const KNOWN_STAKING = new Set(
  knownStakingContracts.map((a) => normalizeAddress(a))
);

// ─────────────────────────────────────────────
// Public classifier
// ─────────────────────────────────────────────

export function classifyTransaction(tx: NormalizedTx): ClassifiedStakingAction {
  // Try each strategy in priority order
  const result =
    tryMethodNameClassify(tx) ??
    tryMethodIdClassify(tx) ??
    tryEventLogClassify(tx) ??
    tryValueFlowClassify(tx) ??
    tryKnownContractClassify(tx) ??
    tryKeywordClassify(tx) ??
    fallbackClassify(tx);

  // Determine amount: prefer token transfer amount over native value for staking txs
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

/** Strategy 4: value/transfer flow heuristic */
function tryValueFlowClassify(tx: NormalizedTx): ClassifyResult | null {
  const to = tx.to ?? "";
  const from = tx.from;
  const hasValue = BigInt(tx.value ?? "0") > 0n;

  // Native ETH sent FROM target TO a contract (no calldata) = potential stake
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

  // Native ETH received TO target FROM a contract = potential claim/withdrawal
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

/** Strategy 5: known staking contract address */
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

/** Strategy 6: keyword scan on method name */
function tryKeywordClassify(tx: NormalizedTx): ClassifyResult | null {
  const method = (tx.method ?? "").toLowerCase();
  if (!method) return null;

  for (const keyword of STAKING_KEYWORDS) {
    if (method.includes(keyword)) {
      const action = guessActionFromKeyword(keyword);
      return {
        actionType: action,
        confidence: "low",
        reason: `Method name contains staking keyword: "${keyword}"`,
        parserSource: "heuristic",
      };
    }
  }
  return null;
}

/** Fallback: no classification */
function fallbackClassify(tx: NormalizedTx): ClassifyResult {
  // If value is 0 and target is sender, it's a contract interaction we don't understand
  if (
    isSameAddress(tx.from, TARGET) &&
    (BigInt(tx.value ?? "0") === 0n) &&
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
// Helpers
// ─────────────────────────────────────────────

function guessActionFromKeyword(keyword: string): ActionType {
  if (["stake", "delegate", "deposit"].includes(keyword)) return "stake";
  if (["unstake", "unbond", "undelegate"].includes(keyword)) return "unstake_request";
  if (["claim", "harvest", "reward"].includes(keyword)) return "reward_claim";
  if (["withdrawal"].includes(keyword)) return "unstake_claim";
  if (["redelegate"].includes(keyword)) return "redelegate";
  return "staking_related_unknown";
}

/**
 * Resolve the primary amount and token symbol for the action.
 * For staking txs, prefer the value moved. For token-based staking, use token transfer amount.
 */
function resolveAmount(
  tx: NormalizedTx,
  actionType: ActionType
): { amountWei: string; tokenSymbol: string } {
  // If there are outgoing token transfers, prefer the largest outgoing one
  const outTransfers = tx.tokenTransfers.filter((t) => t.direction === "out");
  const inTransfers = tx.tokenTransfers.filter((t) => t.direction === "in");

  if (actionType === "stake" || actionType === "unstake_request") {
    if (outTransfers.length > 0) {
      const largest = outTransfers.reduce((a, b) =>
        BigInt(a.rawAmount) > BigInt(b.rawAmount) ? a : b
      );
      return {
        amountWei: largest.rawAmount,
        tokenSymbol: largest.tokenSymbol ?? nativeSymbol,
      };
    }
  }

  if (actionType === "unstake_claim" || actionType === "reward_claim") {
    if (inTransfers.length > 0) {
      const largest = inTransfers.reduce((a, b) =>
        BigInt(a.rawAmount) > BigInt(b.rawAmount) ? a : b
      );
      return {
        amountWei: largest.rawAmount,
        tokenSymbol: largest.tokenSymbol ?? nativeSymbol,
      };
    }
  }

  // Fall back to native value
  return { amountWei: tx.value ?? "0", tokenSymbol: nativeSymbol };
}

/**
 * Addresses that are clearly NOT staking contracts
 * (add as needed)
 */
const KNOWN_NON_STAKING = new Set<string>([
  // e.g. known DEX routers, bridges, etc.
]);

function isKnownNonStaking(addr: string): boolean {
  return KNOWN_NON_STAKING.has(normalizeAddress(addr));
}
