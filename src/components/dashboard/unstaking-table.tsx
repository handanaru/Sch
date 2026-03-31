"use client";
import { useState } from "react";
import type { StakingRequest } from "@/lib/staking/types";
import { UnstakeStatusBadge } from "./status-badge";
import { Button } from "@/components/ui/button";
import { shortHash, explorerTxUrl, copyToClipboard } from "@/lib/utils/tx";
import { shortDate, formatTimestamp } from "@/lib/utils/time";
import { DASHBOARD_CONFIG } from "@/config/dashboard";
import { Copy, ExternalLink, ChevronUp, ChevronDown } from "lucide-react";

interface Props {
  requests: StakingRequest[];
  onSelectRequest?: (req: StakingRequest) => void;
}

type SortField = "requestTimestampMs" | "requestAmountFormatted" | "status";
type SortDir = "asc" | "desc";

export function UnstakingTable({ requests, onSelectRequest }: Props) {
  const [sortField, setSortField] = useState<SortField>("requestTimestampMs");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [copied, setCopied] = useState<string | null>(null);

  const sorted = [...requests].sort((a, b) => {
    let va: string | number = a[sortField] as string | number;
    let vb: string | number = b[sortField] as string | number;
    if (typeof va === "string" && typeof vb === "string") {
      va = va.toLowerCase();
      vb = vb.toLowerCase();
    }
    if (va < vb) return sortDir === "asc" ? -1 : 1;
    if (va > vb) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
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

  async function handleCopy(text: string) {
    await copyToClipboard(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 1500);
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        No unstake requests found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <Th onClick={() => toggleSort("requestTimestampMs")}>
              Time <SortIcon field="requestTimestampMs" />
            </Th>
            <Th>Request Tx</Th>
            <Th onClick={() => toggleSort("requestAmountFormatted")}>
              Amount <SortIcon field="requestAmountFormatted" />
            </Th>
            <Th onClick={() => toggleSort("status")}>
              Status <SortIcon field="status" />
            </Th>
            <Th>Est. Unlock</Th>
            <Th>Claim Tx</Th>
            <Th>Match Method</Th>
            <Th>Confidence</Th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((req) => (
            <tr
              key={req.id}
              className="border-t border-border hover:bg-muted/20 cursor-pointer transition-colors"
              onClick={() => onSelectRequest?.(req)}
            >
              <Td>
                <div className="whitespace-nowrap" title={formatTimestamp(req.requestTimestamp)}>
                  {shortDate(req.requestTimestamp)}
                </div>
              </Td>
              <Td>
                <div className="flex items-center gap-1">
                  <span className="font-mono text-xs text-muted-foreground">
                    {shortHash(req.requestTxHash)}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopy(req.requestTxHash);
                    }}
                    className="opacity-50 hover:opacity-100"
                    title="Copy hash"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                  <a
                    href={explorerTxUrl(DASHBOARD_CONFIG.explorerBaseUrl, req.requestTxHash)}
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
              <Td>
                <span className="font-medium">{req.requestAmountFormatted}</span>
              </Td>
              <Td>
                <UnstakeStatusBadge status={req.status} />
              </Td>
              <Td>
                {req.estimatedUnlockMs ? (
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {shortDate(new Date(req.estimatedUnlockMs).toISOString())}
                  </span>
                ) : (
                  "—"
                )}
              </Td>
              <Td>
                {req.claimTxHash ? (
                  <div className="flex items-center gap-1">
                    <span className="font-mono text-xs text-muted-foreground">
                      {shortHash(req.claimTxHash)}
                    </span>
                    <a
                      href={explorerTxUrl(DASHBOARD_CONFIG.explorerBaseUrl, req.claimTxHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="opacity-50 hover:opacity-100"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                ) : (
                  <span className="text-muted-foreground text-xs">—</span>
                )}
              </Td>
              <Td>
                <span className="text-xs text-muted-foreground capitalize">
                  {req.matchingMethod.replace(/_/g, " ")}
                </span>
              </Td>
              <Td>
                <span
                  className={`text-xs font-medium ${
                    req.matchingConfidence === "high"
                      ? "text-emerald-400"
                      : req.matchingConfidence === "medium"
                      ? "text-amber-400"
                      : "text-slate-400"
                  }`}
                >
                  {req.matchingConfidence}
                </span>
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
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
  return <td className="px-4 py-3 text-sm">{children}</td>;
}
