"use client";
import { useState } from "react";
import type { FilterState, ActionType, TxStatus } from "@/lib/staking/types";
import { DEFAULT_FILTER_STATE } from "@/lib/staking/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { actionTypeLabel } from "@/lib/utils/format";
import { X, SlidersHorizontal } from "lucide-react";

const ACTION_TYPES: ActionType[] = [
  "stake",
  "unstake_request",
  "unstake_claim",
  "withdraw",
  "restake",
  "redelegate",
  "reward_claim",
  "staking_related_unknown",
  "non_staking",
];

const TX_STATUSES: { value: TxStatus; label: string }[] = [
  { value: "ok", label: "Success" },
  { value: "error", label: "Failed" },
  { value: "pending", label: "Pending" },
];

interface Props {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
}

export function FiltersBar({ filters, onChange }: Props) {
  const [expanded, setExpanded] = useState(false);

  function update(patch: Partial<FilterState>) {
    onChange({ ...filters, ...patch });
  }

  function toggleActionType(type: ActionType) {
    const current = filters.actionTypes;
    if (current.includes(type)) {
      update({ actionTypes: current.filter((t) => t !== type) });
    } else {
      update({ actionTypes: [...current, type] });
    }
  }

  function toggleStatus(status: TxStatus) {
    const current = filters.statuses;
    if (current.includes(status)) {
      update({ statuses: current.filter((s) => s !== status) });
    } else {
      update({ statuses: [...current, status] });
    }
  }

  function reset() {
    onChange({ ...DEFAULT_FILTER_STATE });
  }

  const hasActiveFilters =
    filters.actionTypes.length > 0 ||
    filters.statuses.length > 0 ||
    filters.txHashSearch !== "" ||
    filters.dateFrom !== null ||
    filters.dateTo !== null ||
    filters.minAmount !== "" ||
    filters.maxAmount !== "" ||
    filters.onlyUnmatched ||
    filters.onlyFailed;

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-4">
      {/* Top row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Search tx hash..."
            value={filters.txHashSearch}
            onChange={(e) => update({ txHashSearch: e.target.value })}
            className="h-9 text-sm font-mono"
          />
        </div>

        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={filters.dateFrom ?? ""}
            onChange={(e) => update({ dateFrom: e.target.value || null })}
            className="h-9 text-sm w-36"
            title="From date"
          />
          <span className="text-muted-foreground text-xs">→</span>
          <Input
            type="date"
            value={filters.dateTo ?? ""}
            onChange={(e) => update({ dateTo: e.target.value || null })}
            className="h-9 text-sm w-36"
            title="To date"
          />
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setExpanded((v) => !v)}
          className="gap-1"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          More filters
          {hasActiveFilters && (
            <Badge variant="default" className="ml-1 px-1.5 py-0 text-xs h-4">
              {[
                filters.actionTypes.length,
                filters.statuses.length,
                filters.onlyUnmatched ? 1 : 0,
                filters.onlyFailed ? 1 : 0,
              ].reduce((a, b) => a + b, 0) || ""}
            </Badge>
          )}
        </Button>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={reset} className="gap-1 text-muted-foreground">
            <X className="h-3.5 w-3.5" />
            Reset
          </Button>
        )}
      </div>

      {/* Expanded filters */}
      {expanded && (
        <div className="space-y-3 pt-2 border-t border-border">
          {/* Action types */}
          <div>
            <div className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wider">
              Action Type
            </div>
            <div className="flex flex-wrap gap-2">
              {ACTION_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => toggleActionType(type)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    filters.actionTypes.includes(type)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
                  }`}
                >
                  {actionTypeLabel(type)}
                </button>
              ))}
            </div>
          </div>

          {/* Status */}
          <div>
            <div className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wider">
              Tx Status
            </div>
            <div className="flex gap-2">
              {TX_STATUSES.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => toggleStatus(value)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    filters.statuses.includes(value)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Amount range */}
          <div className="flex items-center gap-3">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Min Amount</div>
              <Input
                placeholder="0"
                value={filters.minAmount}
                onChange={(e) => update({ minAmount: e.target.value })}
                className="h-8 text-sm w-28"
                type="number"
                min={0}
              />
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Max Amount</div>
              <Input
                placeholder="∞"
                value={filters.maxAmount}
                onChange={(e) => update({ maxAmount: e.target.value })}
                className="h-8 text-sm w-28"
                type="number"
                min={0}
              />
            </div>
          </div>

          {/* Toggle options */}
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.onlyUnmatched}
                onChange={(e) => update({ onlyUnmatched: e.target.checked })}
                className="rounded"
              />
              <span className="text-xs text-muted-foreground">Only unmatched</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.onlyFailed}
                onChange={(e) => update({ onlyFailed: e.target.checked })}
                className="rounded"
              />
              <span className="text-xs text-muted-foreground">Only failed</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
