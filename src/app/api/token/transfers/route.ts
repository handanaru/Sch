/**
 * GET /api/token/transfers?contract=0x...&address=0x...
 * Returns token transfers — all or filtered by holder address.
 * Uses Blockscout v2 /tokens/{addr}/transfers or /addresses/{addr}/token-transfers
 */

import { NextRequest, NextResponse } from "next/server";
import { DASHBOARD_CONFIG } from "@/config/dashboard";

const { apiBaseUrl } = DASHBOARD_CONFIG;

const PER_PAGE_TIMEOUT_MS = 10000;
const MAX_PAGES = 100;          // 100 pages × 50 = 5000 transfers
const PAGE_DELAY_MS = 100;
const CACHE_TTL_MS = 3 * 60 * 1000;
const OVERALL_TIMEOUT_MS = 55000;

const cache = new Map<string, { data: unknown; expiresAt: number }>();

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

interface RawTransfer {
  transaction_hash: string;
  block_number: number;
  timestamp: string;
  from: { hash: string; name: string | null; is_contract: boolean } | null;
  to: { hash: string; name: string | null; is_contract: boolean } | null;
  total: { value: string; decimals: string } | null;
  type: string;
  token: { symbol: string | null; name: string | null; decimals: string | null } | null;
}

function normalizeTransfer(raw: RawTransfer): NormalizedTransfer {
  const decimals = parseInt(raw.token?.decimals ?? raw.total?.decimals ?? "18");
  const rawAmount = raw.total?.value ?? "0";
  const symbol = raw.token?.symbol ?? DASHBOARD_CONFIG.nativeSymbol;

  let formattedAmount = rawAmount;
  try {
    const big = BigInt(rawAmount);
    const div = BigInt(10 ** Math.min(decimals, 18));
    const whole = big / div;
    const frac = big % div;
    const fracStr = frac.toString().padStart(Math.min(decimals, 18), "0").replace(/0+$/, "").slice(0, 6);
    formattedAmount = fracStr ? `${whole}.${fracStr}` : whole.toString();
  } catch {/* keep raw */}

  return {
    txHash: raw.transaction_hash ?? "",
    blockNumber: raw.block_number ?? 0,
    timestamp: raw.timestamp ?? "",
    timestampMs: raw.timestamp ? new Date(raw.timestamp).getTime() : 0,
    from: raw.from?.hash?.toLowerCase() ?? "",
    fromName: raw.from?.name ?? null,
    fromIsContract: raw.from?.is_contract ?? false,
    to: raw.to?.hash?.toLowerCase() ?? "",
    toName: raw.to?.name ?? null,
    toIsContract: raw.to?.is_contract ?? false,
    rawAmount,
    formattedAmount,
    tokenSymbol: symbol,
    type: raw.type ?? "token_transfer",
  };
}

async function fetchPage(url: string): Promise<{
  items: RawTransfer[];
  next_page_params: Record<string, unknown> | null;
}> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), PER_PAGE_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: ctrl.signal, cache: "no-store" });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

async function fetchAllTransfers(
  contract: string,
  filterAddress?: string
): Promise<{ transfers: NormalizedTransfer[]; errors: string[]; pagesFetched: number; truncated: boolean }> {
  const items: RawTransfer[] = [];
  const errors: string[] = [];
  const seen = new Set<string>();
  let nextPageParams: Record<string, unknown> | null = null;
  let pages = 0;
  const deadline = Date.now() + OVERALL_TIMEOUT_MS;

  const baseUrl = filterAddress
    ? `${apiBaseUrl}/addresses/${filterAddress}/token-transfers?token=${contract}`
    : `${apiBaseUrl}/tokens/${contract}/transfers`;

  while (pages < MAX_PAGES && Date.now() < deadline) {
    const params = new URLSearchParams();
    if (nextPageParams) {
      for (const [k, v] of Object.entries(nextPageParams)) {
        params.set(k, String(v));
      }
    }
    const sep = baseUrl.includes("?") ? "&" : "?";
    const url = params.toString() ? `${baseUrl}${sep}${params}` : baseUrl;

    let page: Awaited<ReturnType<typeof fetchPage>>;
    try {
      page = await fetchPage(url);
    } catch (err) {
      errors.push(`Page ${pages + 1} error: ${err instanceof Error ? err.message : String(err)}`);
      break;
    }

    pages++;
    let added = 0;
    for (const item of page.items ?? []) {
      const key = `${item.transaction_hash}_${item.from?.hash}_${item.to?.hash}`;
      if (!seen.has(key)) {
        seen.add(key);
        items.push(item);
        added++;
      }
    }

    if (!page.next_page_params || added === 0) break;
    nextPageParams = page.next_page_params;
    await new Promise((r) => setTimeout(r, PAGE_DELAY_MS));
  }

  items.sort((a, b) => {
    const ta = a.timestamp ? new Date(a.timestamp).getTime() : 0;
    const tb = b.timestamp ? new Date(b.timestamp).getTime() : 0;
    return tb - ta;
  });

  return {
    transfers: items.map(normalizeTransfer),
    errors,
    pagesFetched: pages,
    truncated: pages >= MAX_PAGES,
  };
}

export async function GET(req: NextRequest) {
  const contract = (
    req.nextUrl.searchParams.get("contract") ?? DASHBOARD_CONFIG.targetAddress
  ).toLowerCase();
  const address = req.nextUrl.searchParams.get("address")?.toLowerCase();
  const force = req.nextUrl.searchParams.get("force") === "1";
  const cacheKey = address ? `${contract}_${address}` : contract;

  if (!force) {
    const cached = cache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
      return NextResponse.json({ data: cached.data, cached: true });
    }
  }

  const result = await fetchAllTransfers(contract, address).catch((err) => ({
    transfers: [] as NormalizedTransfer[],
    errors: [String(err)],
    pagesFetched: 0,
    truncated: false,
  }));

  const data = { ...result, fetchedAt: new Date().toISOString() };
  cache.set(cacheKey, { data, expiresAt: Date.now() + CACHE_TTL_MS });
  return NextResponse.json({ data, cached: false });
}
