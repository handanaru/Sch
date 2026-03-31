/**
 * Fetches ALL transactions for an address by paginating until exhausted.
 * Handles deduplication, rate limiting, and error recovery.
 */

import {
  fetchAddressTransactions,
  fetchTokenTransfers,
} from "./client";
import { DASHBOARD_CONFIG } from "@/config/dashboard";
import type { BlockscoutTransaction, BlockscoutNextPageParams, BlockscoutTokenTransfer } from "@/types/explorer";

const { maxFetchLimit } = DASHBOARD_CONFIG;

// Delay between pages to avoid rate limiting
const PAGE_DELAY_MS = 150;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ─────────────────────────────────────────────
// Fetch all transactions (paginated)
// ─────────────────────────────────────────────

export interface FetchAllResult {
  transactions: BlockscoutTransaction[];
  totalFetched: number;
  errors: string[];
  truncated: boolean; // true if hit maxFetchLimit
}

export async function fetchAllTransactions(
  address: string,
  onProgress?: (fetched: number) => void
): Promise<FetchAllResult> {
  const seen = new Set<string>();
  const transactions: BlockscoutTransaction[] = [];
  const errors: string[] = [];
  let nextPageParams: BlockscoutNextPageParams | null = null;
  let truncated = false;

  while (true) {
    if (transactions.length >= maxFetchLimit) {
      truncated = true;
      break;
    }

    let page;
    try {
      page = await fetchAddressTransactions(address, nextPageParams ?? undefined);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Tx fetch page error: ${msg}`);
      // Stop on consecutive errors; partial data is still useful
      break;
    }

    const items = page.items ?? [];
    let addedThisPage = 0;

    for (const tx of items) {
      if (!seen.has(tx.hash)) {
        seen.add(tx.hash);
        transactions.push(tx);
        addedThisPage++;
      }
    }

    onProgress?.(transactions.length);

    if (!page.next_page_params || addedThisPage === 0) {
      // No more pages
      break;
    }

    nextPageParams = page.next_page_params;
    await sleep(PAGE_DELAY_MS);
  }

  return {
    transactions,
    totalFetched: transactions.length,
    errors,
    truncated,
  };
}

// ─────────────────────────────────────────────
// Fetch all token transfers (paginated)
// ─────────────────────────────────────────────

export interface FetchAllTokenTransfersResult {
  transfers: BlockscoutTokenTransfer[];
  errors: string[];
  truncated: boolean;
}

export async function fetchAllTokenTransfers(
  address: string
): Promise<FetchAllTokenTransfersResult> {
  const seen = new Set<string>();
  const transfers: BlockscoutTokenTransfer[] = [];
  const errors: string[] = [];
  let nextPageParams: BlockscoutNextPageParams | null = null;
  let truncated = false;
  const limit = maxFetchLimit;

  while (true) {
    if (transfers.length >= limit) {
      truncated = true;
      break;
    }

    let page;
    try {
      page = await fetchTokenTransfers(address, nextPageParams ?? undefined);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Token transfer fetch error: ${msg}`);
      break;
    }

    const items = page.items ?? [];
    let addedThisPage = 0;

    for (const transfer of items) {
      // Use tx_hash + index as dedup key
      const key = `${transfer.transaction_hash}`;
      if (!seen.has(key)) {
        seen.add(key);
        transfers.push(transfer);
        addedThisPage++;
      }
    }

    if (!page.next_page_params || addedThisPage === 0) {
      break;
    }

    nextPageParams = page.next_page_params;
    await sleep(PAGE_DELAY_MS);
  }

  return { transfers, errors, truncated };
}

// ─────────────────────────────────────────────
// Merge token transfers into tx list
// ─────────────────────────────────────────────

/**
 * Attach token transfers to their corresponding transactions (by hash).
 * Mutates the input transactions array for efficiency.
 */
export function mergeTokenTransfersIntoTxs(
  transactions: BlockscoutTransaction[],
  transfers: BlockscoutTokenTransfer[]
): void {
  const txMap = new Map<string, BlockscoutTransaction>();
  for (const tx of transactions) {
    txMap.set(tx.hash.toLowerCase(), tx);
  }

  for (const transfer of transfers) {
    const txHash = transfer.transaction_hash?.toLowerCase();
    if (!txHash) continue;
    const tx = txMap.get(txHash);
    if (tx) {
      if (!tx.token_transfers) tx.token_transfers = [];
      tx.token_transfers.push(transfer);
    }
  }
}
