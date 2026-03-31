/**
 * GET /api/token/transfers?contract=0x...&address=0x...
 *
 * Returns all token transfers for either:
 * - a specific token contract (all transfers of that token)
 * - a specific holder address (their transfers of that token)
 */

import { NextRequest, NextResponse } from "next/server";
import { DASHBOARD_CONFIG } from "@/config/dashboard";

const { apiBaseUrl, fetchTimeoutMs, maxRetries, retryDelayMs } = DASHBOARD_CONFIG;
const PAGE_DELAY_MS = 150;
const CACHE_TTL_MS = 3 * 60 * 1000;

interface RawTransfer {
  transaction_hash: string;
  block_number: number;
  timestamp: string;
  from: { hash: string; name: string | null; is_contract: boolean };
  to: { hash: string; name: string | null; is_contract: boolean };
  total: { value: string; decimals: string };
  type: string;
  token: { symbol: string | null; name: string | null; decimals: string | null };
}

const cache = new Map<string, { data: unknown; expiresAt: number }>();

async function fetchWithRetry(url: string, attempt = 0): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), fetchTimeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
    return res;
  } catch (err) {
    clearTimeout(timer);
    if (attempt < maxRetries) {
      await new Promise((r) => setTimeout(r, retryDelayMs * 2 ** attempt));
      return fetchWithRetry(url, attempt + 1);
    }
    throw err;
  }
}

async function fetchAllTransfers(
  contract: string,
  filterAddress?: string
): Promise<{ transfers: NormalizedTransfer[]; errors: string[] }> {
  const transfers: RawTransfer[] = [];
  const errors: string[] = [];
  const seen = new Set<string>();
  let nextPageParams: Record<string, unknown> | null = null;

  // Blockscout: GET /tokens/{contract}/transfers  OR  /addresses/{addr}/token-transfers?token={contract}
  const baseUrl = filterAddress
    ? `${apiBaseUrl}/addresses/${filterAddress}/token-transfers?token=${contract}`
    : `${apiBaseUrl}/tokens/${contract}/transfers`;

  while (true) {
    const params = new URLSearchParams();
    if (nextPageParams) {
      for (const [k, v] of Object.entries(nextPageParams)) {
        params.set(k, String(v));
      }
    }
    const sep = baseUrl.includes("?") ? "&" : "?";
    const url = `${baseUrl}${params.toString() ? sep + params : ""}`;

    let page: { items: RawTransfer[]; next_page_params: Record<string, unknown> | null };
    try {
      const res = await fetchWithRetry(url);
      page = await res.json();
    } catch (err) {
      errors.push(`Transfer fetch error: ${err instanceof Error ? err.message : String(err)}`);
      break;
    }

    let added = 0;
    for (const item of page.items ?? []) {
      const key = `${item.transaction_hash}_${item.from?.hash}_${item.to?.hash}`;
      if (!seen.has(key)) {
        seen.add(key);
        transfers.push(item);
        added++;
      }
    }

    if (!page.next_page_params || added === 0) break;
    nextPageParams = page.next_page_params;
    await new Promise((r) => setTimeout(r, PAGE_DELAY_MS));
    if (transfers.length >= 5000) break;
  }

  // Sort newest first
  transfers.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return {
    transfers: transfers.map(normalizeTransfer),
    errors,
  };
}

export interface NormalizedTransfer {
  txHash: string;
  blockNumber: number;
  timestamp: string;
  timestampMs: number;
  from: string;
  fromName: string | null;
  fromIsContract: boolean;
  to: string;
  toName: string | null;
  toIsContract: boolean;
  rawAmount: string;
  formattedAmount: string;
  tokenSymbol: string | null;
  type: string;
}

function normalizeTransfer(raw: RawTransfer): NormalizedTransfer {
  const decimals = parseInt(raw.token?.decimals ?? raw.total?.decimals ?? "18");
  const rawAmount = raw.total?.value ?? "0";
  const symbol = raw.token?.symbol ?? DASHBOARD_CONFIG.nativeSymbol;

  let formattedAmount = rawAmount;
  try {
    const big = BigInt(rawAmount);
    const div = BigInt(10 ** decimals);
    const whole = big / div;
    const frac = big % div;
    const fracStr = frac.toString().padStart(decimals, "0").replace(/0+$/, "").slice(0, 6);
    formattedAmount = fracStr ? `${whole}.${fracStr}` : whole.toString();
  } catch {/* keep raw */}

  return {
    txHash: raw.transaction_hash,
    blockNumber: raw.block_number,
    timestamp: raw.timestamp,
    timestampMs: new Date(raw.timestamp).getTime(),
    from: raw.from?.hash?.toLowerCase() ?? "",
    fromName: raw.from?.name,
    fromIsContract: raw.from?.is_contract ?? false,
    to: raw.to?.hash?.toLowerCase() ?? "",
    toName: raw.to?.name,
    toIsContract: raw.to?.is_contract ?? false,
    rawAmount,
    formattedAmount,
    tokenSymbol: symbol,
    type: raw.type,
  };
}

export async function GET(req: NextRequest) {
  const contract =
    req.nextUrl.searchParams.get("contract") ?? DASHBOARD_CONFIG.targetAddress;
  const address = req.nextUrl.searchParams.get("address") ?? undefined;
  const force = req.nextUrl.searchParams.get("force") === "1";
  const cacheKey = `${contract}_${address ?? "all"}`;

  if (!force) {
    const cached = cache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
      return NextResponse.json({ data: cached.data, cached: true });
    }
  }

  try {
    const result = await fetchAllTransfers(contract.toLowerCase(), address?.toLowerCase());
    const data = { ...result, fetchedAt: new Date().toISOString() };
    cache.set(cacheKey, { data, expiresAt: Date.now() + CACHE_TTL_MS });
    return NextResponse.json({ data, cached: false });
  } catch (err) {
    return NextResponse.json(
      { data: null, error: String(err), cached: false },
      { status: 500 }
    );
  }
}
