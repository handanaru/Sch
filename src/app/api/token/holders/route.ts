/**
 * GET /api/token/holders?contract=0x...&page=0
 *
 * Returns all token holders sorted by balance descending.
 * Uses Blockscout v2 /tokens/{address}/holders endpoint.
 */

import { NextRequest, NextResponse } from "next/server";
import { DASHBOARD_CONFIG } from "@/config/dashboard";

const { apiBaseUrl, fetchTimeoutMs, maxRetries, retryDelayMs } = DASHBOARD_CONFIG;

const PAGE_DELAY_MS = 150;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 min

interface HolderItem {
  address: { hash: string; name: string | null; is_contract: boolean };
  value: string; // raw token amount
}

interface HoldersResponse {
  items: HolderItem[];
  next_page_params: Record<string, unknown> | null;
}

// in-process cache
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

async function fetchAllHolders(contract: string): Promise<{
  holders: Array<{ address: string; name: string | null; isContract: boolean; rawBalance: string; rank: number }>;
  errors: string[];
}> {
  const holders: HolderItem[] = [];
  const errors: string[] = [];
  let nextPageParams: Record<string, unknown> | null = null;
  const seen = new Set<string>();

  while (true) {
    const params = new URLSearchParams();
    if (nextPageParams) {
      for (const [k, v] of Object.entries(nextPageParams)) {
        params.set(k, String(v));
      }
    }
    const qs = params.toString() ? `?${params}` : "";
    const url = `${apiBaseUrl}/tokens/${contract}/holders${qs}`;

    let page: HoldersResponse;
    try {
      const res = await fetchWithRetry(url);
      page = await res.json();
    } catch (err) {
      errors.push(`Holder fetch error: ${err instanceof Error ? err.message : String(err)}`);
      break;
    }

    let added = 0;
    for (const item of page.items ?? []) {
      const addr = item.address?.hash?.toLowerCase();
      if (addr && !seen.has(addr)) {
        seen.add(addr);
        holders.push(item);
        added++;
      }
    }

    if (!page.next_page_params || added === 0) break;
    nextPageParams = page.next_page_params;
    await new Promise((r) => setTimeout(r, PAGE_DELAY_MS));

    // cap at 10000 holders
    if (holders.length >= 10000) break;
  }

  // sort by balance descending
  holders.sort((a, b) => {
    try {
      const ba = BigInt(a.value);
      const bb = BigInt(b.value);
      return bb > ba ? 1 : bb < ba ? -1 : 0;
    } catch {
      return 0;
    }
  });

  return {
    holders: holders.map((h, i) => ({
      address: h.address.hash.toLowerCase(),
      name: h.address.name,
      isContract: h.address.is_contract,
      rawBalance: h.value,
      rank: i + 1,
    })),
    errors,
  };
}

export async function GET(req: NextRequest) {
  const contract =
    req.nextUrl.searchParams.get("contract") ??
    DASHBOARD_CONFIG.targetAddress;
  const force = req.nextUrl.searchParams.get("force") === "1";
  const key = contract.toLowerCase();

  if (!force) {
    const cached = cache.get(key);
    if (cached && Date.now() < cached.expiresAt) {
      return NextResponse.json({ data: cached.data, cached: true });
    }
  }

  try {
    const result = await fetchAllHolders(key);

    // Fetch token info
    let tokenInfo: { name: string | null; symbol: string | null; decimals: string | null; total_supply: string | null } = {
      name: null, symbol: null, decimals: null, total_supply: null,
    };
    try {
      const infoRes = await fetchWithRetry(`${apiBaseUrl}/tokens/${key}`);
      tokenInfo = await infoRes.json();
    } catch {/* ignore */}

    const data = { ...result, tokenInfo, fetchedAt: new Date().toISOString() };
    cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
    return NextResponse.json({ data, cached: false });
  } catch (err) {
    return NextResponse.json(
      { data: null, error: String(err), cached: false },
      { status: 500 }
    );
  }
}
