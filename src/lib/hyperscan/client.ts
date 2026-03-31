/**
 * Hyperscan (Blockscout v2) API client.
 * All network calls go through this module.
 */

import { DASHBOARD_CONFIG } from "@/config/dashboard";
import type {
  BlockscoutTransactionListResponse,
  BlockscoutTransaction,
  BlockscoutInternalTxListResponse,
  BlockscoutNextPageParams,
} from "@/types/explorer";

const { apiBaseUrl, fetchTimeoutMs, maxRetries, retryDelayMs } = DASHBOARD_CONFIG;

// ─────────────────────────────────────────────
// Base fetch with retry + timeout
// ─────────────────────────────────────────────

async function fetchWithRetry(
  url: string,
  attempt = 0
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), fetchTimeoutMs);

  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status} from ${url}: ${body.slice(0, 200)}`);
    }
    return res;
  } catch (err) {
    clearTimeout(timer);
    if (attempt < maxRetries) {
      const delay = retryDelayMs * 2 ** attempt;
      await new Promise((r) => setTimeout(r, delay));
      return fetchWithRetry(url, attempt + 1);
    }
    throw err;
  }
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetchWithRetry(url);
  return res.json() as Promise<T>;
}

// ─────────────────────────────────────────────
// Endpoints
// ─────────────────────────────────────────────

/**
 * Fetch a page of transactions for an address.
 * next_page_params → pass as query params for pagination.
 */
export async function fetchAddressTransactions(
  address: string,
  pageParams?: BlockscoutNextPageParams,
  filter?: "to" | "from"
): Promise<BlockscoutTransactionListResponse> {
  const params = new URLSearchParams();
  if (filter) params.set("filter", filter);
  if (pageParams) {
    params.set("block_number", pageParams.block_number.toString());
    params.set("index", pageParams.index.toString());
    params.set("items_count", pageParams.items_count.toString());
    if (pageParams.filter) params.set("filter", pageParams.filter);
  }

  const qs = params.toString() ? `?${params.toString()}` : "";
  const url = `${apiBaseUrl}/addresses/${address}/transactions${qs}`;
  return getJson<BlockscoutTransactionListResponse>(url);
}

/**
 * Fetch a single transaction (includes decoded_input, token_transfers when available).
 */
export async function fetchTransaction(
  hash: string
): Promise<BlockscoutTransaction> {
  const url = `${apiBaseUrl}/transactions/${hash}`;
  return getJson<BlockscoutTransaction>(url);
}

/**
 * Fetch logs for a transaction.
 */
export async function fetchTransactionLogs(hash: string): Promise<{
  items: import("@/types/explorer").BlockscoutLog[];
}> {
  const url = `${apiBaseUrl}/transactions/${hash}/logs`;
  return getJson(url);
}

/**
 * Fetch internal transactions for an address.
 */
export async function fetchInternalTransactions(
  address: string,
  pageParams?: BlockscoutNextPageParams
): Promise<BlockscoutInternalTxListResponse> {
  const params = new URLSearchParams();
  if (pageParams) {
    params.set("block_number", pageParams.block_number.toString());
    params.set("index", pageParams.index.toString());
    params.set("items_count", pageParams.items_count.toString());
  }

  const qs = params.toString() ? `?${params.toString()}` : "";
  const url = `${apiBaseUrl}/addresses/${address}/internal-transactions${qs}`;
  return getJson<BlockscoutInternalTxListResponse>(url);
}

/**
 * Fetch token transfers for an address.
 */
export async function fetchTokenTransfers(
  address: string,
  pageParams?: BlockscoutNextPageParams
): Promise<{
  items: import("@/types/explorer").BlockscoutTokenTransfer[];
  next_page_params: BlockscoutNextPageParams | null;
}> {
  const params = new URLSearchParams();
  if (pageParams) {
    params.set("block_number", pageParams.block_number.toString());
    params.set("index", pageParams.index.toString());
    params.set("items_count", pageParams.items_count.toString());
  }

  const qs = params.toString() ? `?${params.toString()}` : "";
  const url = `${apiBaseUrl}/addresses/${address}/token-transfers${qs}`;
  return getJson(url);
}

export { apiBaseUrl };
