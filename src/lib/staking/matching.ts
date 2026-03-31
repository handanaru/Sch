/**
 * Matches unstake_request transactions with their corresponding unstake_claim / withdraw txs.
 *
 * Matching priority:
 * 1. request_id: same on-chain request ID found in decoded params / logs
 * 2. event_data: matching identifiers extracted from event logs
 * 3. amount_exact: same exact amount, first available claim after the request
 * 4. amount_and_time: closest-in-time claim with similar amount
 */

import type {
  ClassifiedStakingAction,
  StakingRequest,
  UnstakeStatus,
  MatchMethod,
  ConfidenceLevel,
} from "./types";
import { DASHBOARD_CONFIG } from "@/config/dashboard";
import { estimateClaimableTime, isClaimable } from "@/lib/utils/time";
import { weiToFormatted } from "@/lib/utils/amount";
import { normalizeAddress } from "@/lib/utils/tx";

const { unstakeUnlockDelayMs, nativeSymbol, nativeDecimals } = DASHBOARD_CONFIG;

// ─────────────────────────────────────────────
// Main matching entry point
// ─────────────────────────────────────────────

export function buildStakingRequests(
  actions: ClassifiedStakingAction[]
): StakingRequest[] {
  // Sort all actions chronologically
  const sorted = [...actions].sort(
    (a, b) => a.tx.timestampMs - b.tx.timestampMs
  );

  const requests = sorted.filter((a) => a.actionType === "unstake_request");
  const claims = sorted.filter(
    (a) =>
      a.actionType === "unstake_claim" ||
      a.actionType === "withdraw" ||
      // reward_claim can sometimes be a withdrawal; include with low confidence
      a.actionType === "reward_claim"
  );

  const usedClaimHashes = new Set<string>();
  const result: StakingRequest[] = [];

  for (const req of requests) {
    const match = findBestMatch(req, claims, usedClaimHashes);

    let status: UnstakeStatus = "pending";
    if (req.tx.status === "error") {
      status = "failed";
    } else if (match) {
      status = "claimed";
      usedClaimHashes.add(match.action.tx.hash);
      // Update the action's matching info (mutate for display purposes)
      req.matchedClaimTxHash = match.action.tx.hash;
      req.matchingMethod = match.method;
      req.matchingConfidence = match.confidence;
      req.matchingNotes = match.notes;
      match.action.matchedRequestTxHash = req.tx.hash;
      match.action.matchingMethod = match.method;
      match.action.matchingConfidence = match.confidence;
    } else {
      // No claim found yet — check if unlock period has passed
      const estimatedUnlock = estimateClaimableTime(
        req.tx.timestamp,
        unstakeUnlockDelayMs
      );
      status = isClaimable(req.tx.timestamp, unstakeUnlockDelayMs)
        ? "claimable"
        : "pending";
    }

    const estimatedUnlockMs =
      req.tx.timestampMs + unstakeUnlockDelayMs;

    result.push({
      id: `${req.tx.hash}_unstake`,
      requestTxHash: req.tx.hash,
      requestTimestamp: req.tx.timestamp,
      requestTimestampMs: req.tx.timestampMs,
      requestAmountWei: req.amountWei,
      requestAmountFormatted: req.amount,
      tokenSymbol: req.tokenSymbol,
      contractAddress: req.contractAddress,
      status,
      estimatedUnlockMs,
      claimTxHash: match?.action.tx.hash ?? null,
      claimTimestamp: match?.action.tx.timestamp ?? null,
      claimAmountFormatted: match?.action.amount ?? null,
      matchingMethod: match?.method ?? "none",
      matchingConfidence: match?.confidence ?? "low",
      matchingNotes: match?.notes ?? "No matching claim found",
      blockNumber: req.tx.blockNumber,
      validatorAddress: req.validatorAddress ?? null,
    });
  }

  return result;
}

// ─────────────────────────────────────────────
// Match finding
// ─────────────────────────────────────────────

interface MatchResult {
  action: ClassifiedStakingAction;
  method: MatchMethod;
  confidence: ConfidenceLevel;
  notes: string;
}

function findBestMatch(
  request: ClassifiedStakingAction,
  claims: ClassifiedStakingAction[],
  usedHashes: Set<string>
): MatchResult | null {
  // Only consider claims AFTER the request
  const candidateClaims = claims.filter(
    (c) =>
      !usedHashes.has(c.tx.hash) &&
      c.tx.timestampMs > request.tx.timestampMs &&
      // Same contract (if known)
      (request.contractAddress === null ||
        c.contractAddress === null ||
        normalizeAddress(request.contractAddress) ===
          normalizeAddress(c.contractAddress ?? ""))
  );

  if (candidateClaims.length === 0) return null;

  // ── Strategy 1: request_id in decoded params ──
  const reqId = extractRequestId(request);
  if (reqId !== null) {
    for (const claim of candidateClaims) {
      const claimId = extractRequestId(claim);
      if (claimId !== null && claimId === reqId) {
        return {
          action: claim,
          method: "request_id",
          confidence: "high",
          notes: `Matched via on-chain request ID: ${reqId}`,
        };
      }
    }
  }

  // ── Strategy 2: exact amount match (closest in time) ──
  const exactAmountMatches = candidateClaims.filter(
    (c) => c.amountWei === request.amountWei && c.amountWei !== "0"
  );
  if (exactAmountMatches.length > 0) {
    // Take the closest in time
    exactAmountMatches.sort(
      (a, b) => a.tx.timestampMs - b.tx.timestampMs
    );
    return {
      action: exactAmountMatches[0],
      method: "amount_exact",
      confidence: "medium",
      notes: `Exact amount match: ${request.amount} (first claim after request)`,
    };
  }

  // ── Strategy 3: amount within 1% tolerance ──
  const reqAmountBig = BigInt(request.amountWei || "0");
  if (reqAmountBig > 0n) {
    const tolerancePct = 1n; // 1%
    const tolerance = (reqAmountBig * tolerancePct) / 100n;

    const approxMatches = candidateClaims.filter((c) => {
      const diff =
        BigInt(c.amountWei || "0") - reqAmountBig;
      const absDiff = diff < 0n ? -diff : diff;
      return absDiff <= tolerance;
    });

    if (approxMatches.length > 0) {
      approxMatches.sort((a, b) => a.tx.timestampMs - b.tx.timestampMs);
      return {
        action: approxMatches[0],
        method: "amount_and_time",
        confidence: "low",
        notes: `Amount within 1% tolerance match (±${weiToFormatted(tolerance.toString(), nativeDecimals, nativeSymbol)})`,
      };
    }
  }

  // ── Strategy 4: same contract, first claim ──
  if (request.contractAddress) {
    const sameContractClaims = candidateClaims.filter(
      (c) =>
        c.contractAddress !== null &&
        normalizeAddress(c.contractAddress) ===
          normalizeAddress(request.contractAddress!)
    );
    if (sameContractClaims.length > 0) {
      sameContractClaims.sort(
        (a, b) => a.tx.timestampMs - b.tx.timestampMs
      );
      return {
        action: sameContractClaims[0],
        method: "amount_and_time",
        confidence: "low",
        notes: "Matched by same staking contract, first available claim (no amount match)",
      };
    }
  }

  return null;
}

// ─────────────────────────────────────────────
// Extract request ID from decoded params / logs
// ─────────────────────────────────────────────

/**
 * Attempts to extract an on-chain request ID from decoded tx data or logs.
 * Common param names: "requestId", "index", "nonce", "id", "requestIndex"
 *
 * Returns null if no ID can be extracted.
 */
function extractRequestId(action: ClassifiedStakingAction): string | null {
  const params = action.tx.decodedParams;
  if (params) {
    for (const key of ["requestId", "request_id", "id", "nonce", "index", "requestIndex"]) {
      if (params[key] !== undefined) {
        return String(params[key]);
      }
    }
  }

  // Try event log decoded params
  for (const log of action.tx.logs) {
    const p = log.decodedParams;
    if (!p) continue;
    for (const key of ["requestId", "request_id", "id", "nonce", "index"]) {
      if (p[key] !== undefined) {
        return String(p[key]);
      }
    }
  }

  return null;
}
