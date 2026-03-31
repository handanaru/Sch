/**
 * Aggregates classified actions into the DashboardSummary.
 */

import type {
  ClassifiedStakingAction,
  StakingRequest,
  DashboardSummary,
} from "./types";
import { addWei, weiToFormatted } from "@/lib/utils/amount";
import { DASHBOARD_CONFIG } from "@/config/dashboard";

const { nativeDecimals, nativeSymbol } = DASHBOARD_CONFIG;

export function buildDashboardSummary(
  actions: ClassifiedStakingAction[],
  requests: StakingRequest[]
): DashboardSummary {
  // ── Total historical staked ──
  const stakeActions = actions.filter(
    (a) => a.actionType === "stake" && a.tx.status === "ok"
  );
  const totalHistoricalStakedWei = stakeActions.reduce(
    (acc, a) => addWei(acc, a.amountWei),
    "0"
  );

  // ── Total historical unstake requested ──
  const unstakeRequests = actions.filter(
    (a) => a.actionType === "unstake_request" && a.tx.status === "ok"
  );
  const totalHistoricalUnstakeRequestedWei = unstakeRequests.reduce(
    (acc, a) => addWei(acc, a.amountWei),
    "0"
  );

  // ── Total claimed (from requests that are claimed) ──
  const claimedRequests = requests.filter((r) => r.status === "claimed");
  const totalClaimedWei = claimedRequests.reduce(
    (acc, r) => addWei(acc, r.requestAmountWei),
    "0"
  );

  // ── Unstaking pending (requested but not yet claimed) ──
  const pendingRequests = requests.filter(
    (r) => r.status === "pending" || r.status === "claimable"
  );
  const unstakingPendingWei = pendingRequests.reduce(
    (acc, r) => addWei(acc, r.requestAmountWei),
    "0"
  );

  // ── Active staked (rough estimate: staked - requested)
  // NOTE: This is a heuristic. Accurate balance requires on-chain call.
  // The actual staked balance = contract.balanceOf(address) which we can't
  // compute from tx history alone (compounding rewards, slashing, etc.)
  let activeStakedWei = "0";
  try {
    const staked = BigInt(totalHistoricalStakedWei);
    const unstakeReq = BigInt(totalHistoricalUnstakeRequestedWei);
    const diff = staked - unstakeReq;
    activeStakedWei = diff > 0n ? diff.toString() : "0";
  } catch {
    activeStakedWei = "0";
  }

  // ── Last activity time ──
  const allTimestamps = actions
    .map((a) => a.tx.timestampMs)
    .filter((t) => t > 0);
  const lastActivityTimeMs =
    allTimestamps.length > 0 ? Math.max(...allTimestamps) : null;
  const lastActivityTime =
    lastActivityTimeMs !== null
      ? new Date(lastActivityTimeMs).toISOString()
      : null;

  // ── Unique contracts ──
  const uniqueContractsInteracted = [
    ...new Set(
      actions
        .map((a) => a.contractAddress)
        .filter((a): a is string => a !== null && a !== "")
    ),
  ];

  return {
    activeStakedWei,
    activeStakedFormatted: weiToFormatted(activeStakedWei, nativeDecimals, nativeSymbol),
    unstakingPendingWei,
    unstakingPendingFormatted: weiToFormatted(unstakingPendingWei, nativeDecimals, nativeSymbol),
    totalClaimedWei,
    totalClaimedFormatted: weiToFormatted(totalClaimedWei, nativeDecimals, nativeSymbol),
    totalHistoricalStakedWei,
    totalHistoricalStakedFormatted: weiToFormatted(
      totalHistoricalStakedWei,
      nativeDecimals,
      nativeSymbol
    ),
    totalHistoricalUnstakeRequestedWei,
    totalHistoricalUnstakeRequestedFormatted: weiToFormatted(
      totalHistoricalUnstakeRequestedWei,
      nativeDecimals,
      nativeSymbol
    ),
    totalRequestCount: unstakeRequests.length,
    totalStakeCount: stakeActions.length,
    totalClaimCount: claimedRequests.length,
    lastActivityTime,
    lastActivityTimeMs,
    uniqueContractsInteracted,
    tokenSymbol: nativeSymbol,
  };
}

// ─────────────────────────────────────────────
// Selectors
// ─────────────────────────────────────────────

/**
 * Filter out non-staking actions for the history table.
 */
export function selectStakingActions(
  actions: ClassifiedStakingAction[]
): ClassifiedStakingAction[] {
  return actions.filter((a) => a.actionType !== "non_staking");
}

/**
 * Filter staking actions by action type(s).
 */
export function filterByActionTypes(
  actions: ClassifiedStakingAction[],
  types: string[]
): ClassifiedStakingAction[] {
  if (types.length === 0) return actions;
  return actions.filter((a) => types.includes(a.actionType));
}

/**
 * Filter actions by date range (ms epoch).
 */
export function filterByDateRange(
  actions: ClassifiedStakingAction[],
  fromMs: number | null,
  toMs: number | null
): ClassifiedStakingAction[] {
  return actions.filter((a) => {
    if (fromMs !== null && a.tx.timestampMs < fromMs) return false;
    if (toMs !== null && a.tx.timestampMs > toMs) return false;
    return true;
  });
}
