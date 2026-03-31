/**
 * GET /api/staking/data?address=0x...
 *
 * Orchestrates the full pipeline:
 * 1. Fetch all transactions from Hyperscan
 * 2. Merge token transfers
 * 3. Normalize
 * 4. Classify
 * 5. Match (unstake requests ↔ claims)
 * 6. Aggregate summary
 * 7. Return DashboardData
 */

import { NextRequest, NextResponse } from "next/server";
import { fetchAllTransactions, fetchAllTokenTransfers, mergeTokenTransfersIntoTxs } from "@/lib/hyperscan/fetch-all";
import { normalizeTransactions } from "@/lib/hyperscan/normalize";
import { classifyTransactions } from "@/lib/staking/classifier";
import { buildStakingRequests } from "@/lib/staking/matching";
import { buildDashboardSummary } from "@/lib/staking/aggregate";
import type { DashboardData } from "@/lib/staking/types";
import { DASHBOARD_CONFIG } from "@/config/dashboard";

// Simple in-process cache: address → {data, fetchedAt}
const cache = new Map<string, { data: DashboardData; expiresAt: number }>();
const CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes

export async function GET(req: NextRequest) {
  const address =
    req.nextUrl.searchParams.get("address") ??
    DASHBOARD_CONFIG.targetAddress;
  const force = req.nextUrl.searchParams.get("force") === "1";

  const normalizedAddress = address.toLowerCase();

  // Cache hit
  if (!force) {
    const cached = cache.get(normalizedAddress);
    if (cached && Date.now() < cached.expiresAt) {
      return NextResponse.json({ data: cached.data, cached: true });
    }
  }

  const errors: string[] = [];

  // ── 1. Fetch all transactions ──
  let txFetchResult;
  try {
    txFetchResult = await fetchAllTransactions(normalizedAddress);
    errors.push(...txFetchResult.errors);
  } catch (err) {
    return NextResponse.json(
      {
        data: null,
        error: `Failed to fetch transactions: ${err instanceof Error ? err.message : String(err)}`,
        cached: false,
      },
      { status: 500 }
    );
  }

  // ── 2. Fetch token transfers (best-effort) ──
  let tokenTransfers: Awaited<ReturnType<typeof fetchAllTokenTransfers>>["transfers"] = [];
  try {
    const tokenResult = await fetchAllTokenTransfers(normalizedAddress);
    tokenTransfers = tokenResult.transfers;
    errors.push(...tokenResult.errors);
  } catch (err) {
    // Non-fatal: token transfers just won't be enriched
    errors.push(
      `Token transfer fetch skipped: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  // ── 3. Merge token transfers into tx list ──
  mergeTokenTransfersIntoTxs(txFetchResult.transactions, tokenTransfers);

  // ── 4. Normalize ──
  const normalized = normalizeTransactions(txFetchResult.transactions);

  // ── 5. Classify ──
  const classified = classifyTransactions(normalized);

  // ── 6. Match requests ↔ claims ──
  const stakingRequests = buildStakingRequests(classified);

  // ── 7. Aggregate ──
  const summary = buildDashboardSummary(classified, stakingRequests);

  const data: DashboardData = {
    address: normalizedAddress,
    summary,
    actions: classified,
    unstakingRequests: stakingRequests,
    fetchedAt: new Date().toISOString(),
    totalTxFetched: txFetchResult.totalFetched,
    errors,
  };

  // Store in cache
  cache.set(normalizedAddress, {
    data,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });

  return NextResponse.json({ data, cached: false });
}
