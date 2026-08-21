/**
 * GET /api/token/holders?contract=0x...
 * Returns token holders sorted by balance descending.
 * Blockscout v2: /tokens/{address}/holders
 */

import { NextRequest, NextResponse } from "next/server";
import { DASHBOARD_CONFIG } from "@/config/dashboard";

const { apiBaseUrl } = DASHBOARD_CONFIG;

const PER_PAGE_TIMEOUT_MS = 10000;
const MAX_PAGES = 40;          // 40 × 50 = 2000 holders max per call
const PAGE_DELAY_MS = 100;
const CACHE_TTL_MS = 5 * 60 * 1000;
const OVERALL_TIMEOUT_MS = 55000;  // stay under Next.js 60s limit

const cache = new Map<string, { data: unknown; expiresAt: number }>();

interface HolderItem {
  address: { hash: string; name: string | null; is_contract: boolean };
  value: string;
}

async function fetchPage(url: string) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), PER_PAGE_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: ctrl.signal, cache: "no-store" });
    clearTimeout(t);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json() as Promise<{ items: HolderItem[]; next_page_params: Record<string, unknown> | null }>;
  } catch (err) {
    clearTimeout(t);
    throw err;
  }
}

async function fetchTokenInfo(contract: string) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), PER_PAGE_TIMEOUT_MS);
  try {
    const res = await fetch(`${apiBaseUrl}/tokens/${contract}`, { signal: ctrl.signal, cache: "no-store" });
    clearTimeout(t);
    if (!res.ok) return null;
    return res.json();
  } catch {
    clearTimeout(t);
    return null;
  }
}

async function fetchAllHolders(contract: string) {
  const holders: HolderItem[] = [];
  const errors: string[] = [];
  const seen = new Set<string>();
  let nextPageParams: Record<string, unknown> | null = null;
  let pages = 0;
  const deadline = Date.now() + OVERALL_TIMEOUT_MS;

  while (pages < MAX_PAGES && Date.now() < deadline) {
    const params = new URLSearchParams();
    if (nextPageParams) {
      for (const [k, v] of Object.entries(nextPageParams)) params.set(k, String(v));
    }
    const qs = params.toString() ? `?${params}` : "";
    const url = `${apiBaseUrl}/tokens/${contract}/holders${qs}`;

    let page: { items: HolderItem[]; next_page_params: Record<string, unknown> | null };
    try {
      page = await fetchPage(url);
    } catch (err) {
      errors.push(`Page ${pages + 1}: ${err instanceof Error ? err.message : String(err)}`);
      break;
    }

    pages++;
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
  }

  holders.sort((a, b) => {
    try {
      const ba = BigInt(a.value ?? "0");
      const bb = BigInt(b.value ?? "0");
      return bb > ba ? 1 : bb < ba ? -1 : 0;
    } catch { return 0; }
  });

  return {
    holders: holders.map((h, i) => ({
      address: h.address.hash.toLowerCase(),
      name: h.address.name,
      isContract: h.address.is_contract,
      rawBalance: h.value ?? "0",
      rank: i + 1,
    })),
    errors,
    pagesFetched: pages,
    truncated: pages >= MAX_PAGES,
  };
}

export async function GET(req: NextRequest) {
  const contract = (req.nextUrl.searchParams.get("contract") ?? DASHBOARD_CONFIG.targetAddress).toLowerCase();
  const force = req.nextUrl.searchParams.get("force") === "1";

  if (!force) {
    const hit = cache.get(contract);
    if (hit && Date.now() < hit.expiresAt) return NextResponse.json({ data: hit.data, cached: true });
  }

  const [tokenInfo, result] = await Promise.all([
    fetchTokenInfo(contract),
    fetchAllHolders(contract).catch((err) => ({
      holders: [],
      errors: [String(err)],
      pagesFetched: 0,
      truncated: false,
    })),
  ]);

  const data = {
    ...result,
    tokenInfo: tokenInfo ?? { name: null, symbol: null, decimals: null, total_supply: null },
    fetchedAt: new Date().toISOString(),
  };

  cache.set(contract, { data, expiresAt: Date.now() + CACHE_TTL_MS });
  return NextResponse.json({ data, cached: false });
}
