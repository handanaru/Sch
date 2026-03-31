"use client";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { shortHash, explorerAddressUrl, copyToClipboard } from "@/lib/utils/tx";
import { DASHBOARD_CONFIG } from "@/config/dashboard";
import { Copy, ExternalLink, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { weiToFormatted } from "@/lib/utils/amount";

export interface HolderRow {
  rank: number;
  address: string;
  name: string | null;
  isContract: boolean;
  rawBalance: string;
}

interface TokenInfo {
  name: string | null;
  symbol: string | null;
  decimals: string | null;
  total_supply: string | null;
}

interface Props {
  holders: HolderRow[];
  tokenInfo: TokenInfo | null;
  onSelectAddress?: (address: string) => void;
  selectedAddress?: string | null;
}

const PAGE_SIZE = 50;

export function HoldersTable({ holders, tokenInfo, onSelectAddress, selectedAddress }: Props) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [copied, setCopied] = useState<string | null>(null);

  const decimals = parseInt(tokenInfo?.decimals ?? "18");
  const symbol = tokenInfo?.symbol ?? DASHBOARD_CONFIG.nativeSymbol;
  const totalSupply = tokenInfo?.total_supply ?? null;

  const filtered = useMemo(() => {
    if (!search) return holders;
    const q = search.toLowerCase();
    return holders.filter(
      (h) =>
        h.address.includes(q) ||
        (h.name?.toLowerCase().includes(q) ?? false)
    );
  }, [holders, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // Compute % of supply
  function pct(rawBalance: string): string {
    if (!totalSupply) return "";
    try {
      const bal = BigInt(rawBalance);
      const sup = BigInt(totalSupply);
      if (sup === 0n) return "";
      const pctVal = (Number(bal * 10000n / sup) / 100).toFixed(2);
      return `${pctVal}%`;
    } catch {
      return "";
    }
  }

  async function handleCopy(addr: string, e: React.MouseEvent) {
    e.stopPropagation();
    await copyToClipboard(addr);
    setCopied(addr);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search address or label..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="pl-9 h-9 text-sm font-mono"
          />
        </div>
        <span className="text-xs text-muted-foreground">
          {filtered.length.toLocaleString()} holder{filtered.length !== 1 ? "s" : ""}
          {search && ` (filtered from ${holders.length.toLocaleString()})`}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <Th className="w-12">Rank</Th>
              <Th>Address</Th>
              <Th className="text-right">Balance</Th>
              <Th className="text-right">% Supply</Th>
              <Th className="w-20">Type</Th>
              <Th className="w-20">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((h) => {
              const isSelected = selectedAddress?.toLowerCase() === h.address;
              return (
                <tr
                  key={h.address}
                  className={`border-t border-border cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-primary/10 hover:bg-primary/15"
                      : "hover:bg-muted/20"
                  }`}
                  onClick={() => onSelectAddress?.(h.address)}
                >
                  <Td className="text-center">
                    <span
                      className={`text-xs font-bold ${
                        h.rank <= 3
                          ? "text-amber-400"
                          : h.rank <= 10
                          ? "text-slate-300"
                          : "text-muted-foreground"
                      }`}
                    >
                      #{h.rank}
                    </span>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <div>
                        {h.name && (
                          <div className="text-xs font-medium text-foreground">{h.name}</div>
                        )}
                        <span className="font-mono text-xs text-muted-foreground">
                          {shortHash(h.address, 10, 8)}
                        </span>
                      </div>
                    </div>
                  </Td>
                  <Td className="text-right">
                    <span className="font-mono font-medium text-sm">
                      {weiToFormatted(h.rawBalance, decimals, symbol)}
                    </span>
                  </Td>
                  <Td className="text-right">
                    <span className="text-xs text-muted-foreground">{pct(h.rawBalance)}</span>
                  </Td>
                  <Td>
                    {h.isContract ? (
                      <Badge variant="secondary" className="text-xs">Contract</Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">EOA</Badge>
                    )}
                  </Td>
                  <Td>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => handleCopy(h.address, e)}
                        className="opacity-50 hover:opacity-100"
                        title="Copy address"
                      >
                        <Copy className={`h-3 w-3 ${copied === h.address ? "text-emerald-400" : ""}`} />
                      </button>
                      <a
                        href={explorerAddressUrl(DASHBOARD_CONFIG.explorerBaseUrl, h.address)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="opacity-50 hover:opacity-100"
                        title="View on explorer"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-1">
          <span className="text-xs text-muted-foreground">
            Page {page + 1} / {totalPages} · showing {paginated.length} of {filtered.length}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline" size="sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline" size="sm"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <th className={`px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap ${className ?? ""}`}>
      {children}
    </th>
  );
}

function Td({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 text-sm align-middle ${className ?? ""}`}>{children}</td>;
}
