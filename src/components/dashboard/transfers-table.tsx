"use client";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { NormalizedTransfer } from "@/app/api/token/transfers/route";
import { shortHash, explorerTxUrl, explorerAddressUrl, copyToClipboard } from "@/lib/utils/tx";
import { shortDate, formatTimestamp } from "@/lib/utils/time";
import { DASHBOARD_CONFIG } from "@/config/dashboard";
import { Copy, ExternalLink, ChevronLeft, ChevronRight, ArrowRight, Search } from "lucide-react";

interface Props {
  transfers: NormalizedTransfer[];
  highlightAddress?: string | null;
  onSelectAddress?: (addr: string) => void;
}

const PAGE_SIZE = 50;

export function TransfersTable({ transfers, highlightAddress, onSelectAddress }: Props) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [typeFilter, setTypeFilter] = useState<"all" | "in" | "out" | "mint" | "burn">("all");

  const highlight = highlightAddress?.toLowerCase();

  const filtered = useMemo(() => {
    let result = [...transfers];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) => t.from.includes(q) || t.to.includes(q) || t.txHash.toLowerCase().includes(q)
      );
    }

    if (typeFilter !== "all" && highlight) {
      result = result.filter((t) => {
        if (typeFilter === "in") return t.to === highlight;
        if (typeFilter === "out") return t.from === highlight;
        if (typeFilter === "mint") return t.type === "token_minting";
        if (typeFilter === "burn") return t.type === "token_burning";
        return true;
      });
    }

    return result;
  }, [transfers, search, typeFilter, highlight]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  function directionOf(t: NormalizedTransfer): "in" | "out" | "self" | "mint" | "burn" {
    if (t.type === "token_minting") return "mint";
    if (t.type === "token_burning") return "burn";
    if (!highlight) return "out";
    if (t.to === highlight && t.from === highlight) return "self";
    if (t.to === highlight) return "in";
    return "out";
  }

  const [copied, setCopied] = useState<string | null>(null);
  async function handleCopy(text: string, e: React.MouseEvent) {
    e.stopPropagation();
    await copyToClipboard(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search address or tx hash..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="pl-9 h-9 text-sm font-mono"
          />
        </div>

        {highlight && (
          <div className="flex items-center gap-1">
            {(["all", "in", "out"] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setTypeFilter(t); setPage(0); }}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  typeFilter === t
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:border-foreground"
                }`}
              >
                {t === "all" ? "All" : t === "in" ? "↓ Received" : "↑ Sent"}
              </button>
            ))}
          </div>
        )}

        <span className="text-xs text-muted-foreground ml-auto">
          {filtered.length.toLocaleString()} transfer{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <Th>Time</Th>
              <Th>From</Th>
              <Th className="w-8"></Th>
              <Th>To</Th>
              <Th className="text-right">Amount</Th>
              <Th>Tx Hash</Th>
              <Th>Block</Th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((t, i) => {
              const dir = directionOf(t);
              const fromIsHighlight = t.from === highlight;
              const toIsHighlight = t.to === highlight;
              return (
                <tr
                  key={`${t.txHash}_${i}`}
                  className={`border-t border-border hover:bg-muted/20 transition-colors ${
                    fromIsHighlight || toIsHighlight ? "bg-muted/10" : ""
                  }`}
                >
                  <Td>
                    <span
                      className="text-xs text-muted-foreground whitespace-nowrap"
                      title={formatTimestamp(t.timestamp)}
                    >
                      {shortDate(t.timestamp)}
                    </span>
                  </Td>
                  <Td>
                    <AddressCell
                      addr={t.from}
                      name={t.fromName}
                      isContract={t.fromIsContract}
                      isHighlight={fromIsHighlight}
                      onClick={() => onSelectAddress?.(t.from)}
                    />
                  </Td>
                  <Td>
                    <div className="flex justify-center">
                      {dir === "mint" ? (
                        <Badge variant="success" className="text-xs px-1">mint</Badge>
                      ) : dir === "burn" ? (
                        <Badge variant="destructive" className="text-xs px-1">burn</Badge>
                      ) : (
                        <ArrowRight className={`h-3.5 w-3.5 ${
                          dir === "in" ? "text-emerald-400" : dir === "out" ? "text-rose-400" : "text-muted-foreground"
                        }`} />
                      )}
                    </div>
                  </Td>
                  <Td>
                    <AddressCell
                      addr={t.to}
                      name={t.toName}
                      isContract={t.toIsContract}
                      isHighlight={toIsHighlight}
                      onClick={() => onSelectAddress?.(t.to)}
                    />
                  </Td>
                  <Td className="text-right">
                    <span
                      className={`font-mono font-medium text-xs ${
                        dir === "in" ? "text-emerald-400" : dir === "out" ? "text-rose-400" : "text-foreground"
                      }`}
                    >
                      {dir === "in" ? "+" : dir === "out" ? "-" : ""}
                      {t.formattedAmount} {t.tokenSymbol}
                    </span>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-xs text-muted-foreground">
                        {shortHash(t.txHash)}
                      </span>
                      <button onClick={(e) => handleCopy(t.txHash, e)} className="opacity-50 hover:opacity-100">
                        <Copy className={`h-3 w-3 ${copied === t.txHash ? "text-emerald-400" : ""}`} />
                      </button>
                      <a
                        href={explorerTxUrl(DASHBOARD_CONFIG.explorerBaseUrl, t.txHash)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="opacity-50 hover:opacity-100"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </Td>
                  <Td>
                    <span className="font-mono text-xs text-muted-foreground">
                      {t.blockNumber.toLocaleString()}
                    </span>
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
            Page {page + 1} / {totalPages} · {paginated.length} of {filtered.length}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function AddressCell({
  addr, name, isContract, isHighlight, onClick,
}: {
  addr: string; name: string | null; isContract: boolean; isHighlight?: boolean; onClick?: () => void;
}) {
  const NULL_ADDR = "0x0000000000000000000000000000000000000000";
  if (addr === NULL_ADDR) {
    return <span className="text-xs text-muted-foreground italic">null</span>;
  }
  return (
    <button
      onClick={onClick}
      className={`text-left hover:text-foreground transition-colors ${isHighlight ? "text-primary font-medium" : "text-muted-foreground"}`}
    >
      {name ? (
        <div>
          <div className="text-xs font-medium">{name}</div>
          <div className="font-mono text-xs opacity-70">{shortHash(addr)}</div>
        </div>
      ) : (
        <span className="font-mono text-xs">{shortHash(addr, 8, 6)}</span>
      )}
    </button>
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
