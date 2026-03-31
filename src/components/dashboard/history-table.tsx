"use client";
import { useState, useMemo } from "react";
import type { ClassifiedStakingAction, FilterState } from "@/lib/staking/types";
import { ActionTypeBadge, TxStatusBadge } from "./status-badge";
import { shortHash, explorerTxUrl, copyToClipboard } from "@/lib/utils/tx";
import { shortDate, formatTimestamp } from "@/lib/utils/time";
import { DASHBOARD_CONFIG } from "@/config/dashboard";
import { Copy, ExternalLink, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  actions: ClassifiedStakingAction[];
  filters: FilterState;
  onSelectAction: (action: ClassifiedStakingAction) => void;
}

type SortField = "timestampMs" | "actionType" | "amount" | "status";
type SortDir = "asc" | "desc";

const PAGE_SIZE = DASHBOARD_CONFIG.pageSize;

export function HistoryTable({ actions, filters, onSelectAction }: Props) {
  const [sortField, setSortField] = useState<SortField>("timestampMs");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(0);

  // ── Apply filters ──
  const filtered = useMemo(() => {
    let result = [...actions];

    if (filters.actionTypes.length > 0) {
      result = result.filter((a) => filters.actionTypes.includes(a.actionType));
    }
    if (filters.statuses.length > 0) {
      result = result.filter((a) => filters.statuses.includes(a.status));
    }
    if (filters.txHashSearch) {
      const q = filters.txHashSearch.toLowerCase();
      result = result.filter((a) => a.tx.hash.toLowerCase().includes(q));
    }
    if (filters.dateFrom) {
      const fromMs = new Date(filters.dateFrom).getTime();
      result = result.filter((a) => a.tx.timestampMs >= fromMs);
    }
    if (filters.dateTo) {
      const toMs = new Date(filters.dateTo).getTime() + 86400000; // include end day
      result = result.filter((a) => a.tx.timestampMs <= toMs);
    }
    if (filters.minAmount) {
      const min = parseFloat(filters.minAmount);
      result = result.filter((a) => {
        const amt = parseFloat(a.amount.replace(/[^0-9.]/g, ""));
        return !isNaN(amt) && amt >= min;
      });
    }
    if (filters.maxAmount) {
      const max = parseFloat(filters.maxAmount);
      result = result.filter((a) => {
        const amt = parseFloat(a.amount.replace(/[^0-9.]/g, ""));
        return !isNaN(amt) && amt <= max;
      });
    }
    if (filters.onlyUnmatched) {
      result = result.filter(
        (a) =>
          (a.actionType === "unstake_request" && !a.matchedClaimTxHash) ||
          (a.actionType === "unstake_claim" && !a.matchedRequestTxHash)
      );
    }
    if (filters.onlyFailed) {
      result = result.filter((a) => a.status === "error");
    }

    return result;
  }, [actions, filters]);

  // ── Sort ──
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let va: string | number;
      let vb: string | number;
      switch (sortField) {
        case "timestampMs":
          va = a.tx.timestampMs;
          vb = b.tx.timestampMs;
          break;
        case "actionType":
          va = a.actionType;
          vb = b.actionType;
          break;
        case "amount":
          va = parseFloat(a.amount.replace(/[^0-9.]/g, "")) || 0;
          vb = parseFloat(b.amount.replace(/[^0-9.]/g, "")) || 0;
          break;
        case "status":
          va = a.status;
          vb = b.status;
          break;
        default:
          return 0;
      }
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [filtered, sortField, sortDir]);

  // ── Pagination ──
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paginated = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
      setPage(0);
    }
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <ChevronDown className="h-3 w-3 opacity-30" />;
    return sortDir === "asc" ? (
      <ChevronUp className="h-3 w-3" />
    ) : (
      <ChevronDown className="h-3 w-3" />
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        No transactions match the current filters.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="text-xs text-muted-foreground px-1">
        {filtered.length} transaction{filtered.length !== 1 ? "s" : ""} found
        {filtered.length !== actions.length && ` (filtered from ${actions.length} total)`}
      </div>

      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <Th onClick={() => toggleSort("timestampMs")}>
                Time <SortIcon field="timestampMs" />
              </Th>
              <Th onClick={() => toggleSort("actionType")}>
                Action <SortIcon field="actionType" />
              </Th>
              <Th onClick={() => toggleSort("amount")}>
                Amount <SortIcon field="amount" />
              </Th>
              <Th onClick={() => toggleSort("status")}>
                Status <SortIcon field="status" />
              </Th>
              <Th>Tx Hash</Th>
              <Th>Block</Th>
              <Th>Method</Th>
              <Th>Confidence</Th>
              <Th>Matched</Th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((action) => (
              <HistoryRow
                key={action.tx.hash}
                action={action}
                onClick={() => onSelectAction(action)}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-1">
          <span className="text-xs text-muted-foreground">
            Page {page + 1} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
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

function HistoryRow({
  action,
  onClick,
}: {
  action: ClassifiedStakingAction;
  onClick: () => void;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy(e: React.MouseEvent) {
    e.stopPropagation();
    await copyToClipboard(action.tx.hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const isMatched =
    action.matchedClaimTxHash || action.matchedRequestTxHash;

  return (
    <tr
      className="border-t border-border hover:bg-muted/20 cursor-pointer transition-colors"
      onClick={onClick}
    >
      <Td>
        <div
          className="whitespace-nowrap text-xs"
          title={formatTimestamp(action.tx.timestamp)}
        >
          {shortDate(action.tx.timestamp)}
        </div>
      </Td>
      <Td>
        <ActionTypeBadge actionType={action.actionType} />
      </Td>
      <Td>
        <span
          className={`font-medium text-xs ${
            action.amountWei === "0" ? "text-muted-foreground" : ""
          }`}
        >
          {action.amountWei === "0" ? "—" : action.amount}
        </span>
      </Td>
      <Td>
        <TxStatusBadge status={action.status} />
      </Td>
      <Td>
        <div className="flex items-center gap-1">
          <span className="font-mono text-xs text-muted-foreground">
            {shortHash(action.tx.hash)}
          </span>
          <button
            onClick={handleCopy}
            className="opacity-50 hover:opacity-100"
            title={copied ? "Copied!" : "Copy hash"}
          >
            <Copy className={`h-3 w-3 ${copied ? "text-emerald-400" : ""}`} />
          </button>
          <a
            href={explorerTxUrl(DASHBOARD_CONFIG.explorerBaseUrl, action.tx.hash)}
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
          {action.tx.blockNumber.toLocaleString()}
        </span>
      </Td>
      <Td>
        <span className="text-xs font-mono text-muted-foreground truncate max-w-[100px] block">
          {action.tx.method ?? action.tx.methodId ?? "—"}
        </span>
      </Td>
      <Td>
        <span
          className={`text-xs font-medium ${
            action.confidence === "high"
              ? "text-emerald-400"
              : action.confidence === "medium"
              ? "text-amber-400"
              : "text-slate-400"
          }`}
        >
          {action.confidence}
        </span>
      </Td>
      <Td>
        {isMatched ? (
          <span className="text-xs text-emerald-400">✓ matched</span>
        ) : action.actionType === "unstake_request" ||
          action.actionType === "unstake_claim" ? (
          <span className="text-xs text-amber-400">unmatched</span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </Td>
    </tr>
  );
}

function Th({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <th
      className={`px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap ${
        onClick ? "cursor-pointer hover:text-foreground select-none" : ""
      }`}
      onClick={onClick}
    >
      <div className="flex items-center gap-1">{children}</div>
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-3 text-sm align-middle">{children}</td>;
}
