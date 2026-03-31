"use client";

import { useState, useEffect, useCallback } from "react";
import type { DashboardData, ClassifiedStakingAction, FilterState, StakingRequest } from "@/lib/staking/types";
import { DEFAULT_FILTER_STATE } from "@/lib/staking/types";
import { selectStakingActions } from "@/lib/staking/aggregate";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { UnstakingTable } from "@/components/dashboard/unstaking-table";
import { HistoryTable } from "@/components/dashboard/history-table";
import { FiltersBar } from "@/components/dashboard/filters-bar";
import { TxDetailDrawer } from "@/components/dashboard/tx-detail-drawer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { DASHBOARD_CONFIG } from "@/config/dashboard";
import { shortHash, explorerAddressUrl, copyToClipboard } from "@/lib/utils/tx";
import {
  RefreshCw,
  Copy,
  ExternalLink,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { fromNow } from "@/lib/utils/time";

// ─────────────────────────────────────────────
// Main Dashboard Page
// ─────────────────────────────────────────────

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cached, setCached] = useState(false);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTER_STATE);
  const [selectedAction, setSelectedAction] = useState<ClassifiedStakingAction | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [addressInput, setAddressInput] = useState(DASHBOARD_CONFIG.targetAddress);
  const [activeAddress, setActiveAddress] = useState(DASHBOARD_CONFIG.targetAddress);
  const [addressCopied, setAddressCopied] = useState(false);

  const fetchData = useCallback(
    async (address: string, force = false) => {
      setLoading(true);
      setError(null);
      try {
        const qs = new URLSearchParams({ address });
        if (force) qs.set("force", "1");
        const res = await fetch(`/api/staking/data?${qs.toString()}`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({ error: "Unknown error" }));
          throw new Error(body.error ?? `HTTP ${res.status}`);
        }
        const json = await res.json();
        if (json.error) throw new Error(json.error);
        setData(json.data);
        setCached(json.cached ?? false);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchData(activeAddress);
  }, [activeAddress, fetchData]);

  function handleAddressSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (addressInput.trim()) {
      setActiveAddress(addressInput.trim().toLowerCase());
    }
  }

  function handleSelectAction(action: ClassifiedStakingAction) {
    setSelectedAction(action);
    setDrawerOpen(true);
  }

  // Convert StakingRequest click to action (find the original action)
  function handleSelectRequest(req: StakingRequest) {
    const action = data?.actions.find((a) => a.tx.hash === req.requestTxHash);
    if (action) {
      setSelectedAction(action);
      setDrawerOpen(true);
    }
  }

  async function copyAddress() {
    await copyToClipboard(activeAddress);
    setAddressCopied(true);
    setTimeout(() => setAddressCopied(false), 1500);
  }

  const stakingActions = data ? selectStakingActions(data.actions) : [];
  const allActions = data?.actions ?? [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur sticky top-0 z-30">
        <div className="max-w-[1600px] mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="text-lg font-bold text-foreground">
              HyperEVM Staking Dashboard
            </div>
            <Badge variant="secondary" className="text-xs">
              {DASHBOARD_CONFIG.chainName}
            </Badge>
          </div>

          {/* Address bar */}
          <form
            onSubmit={handleAddressSubmit}
            className="flex items-center gap-2 flex-1 max-w-xl"
          >
            <input
              value={addressInput}
              onChange={(e) => setAddressInput(e.target.value)}
              placeholder="0x... address"
              className="flex-1 h-8 bg-muted border border-border rounded-md px-3 text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <Button type="submit" size="sm" variant="outline" className="h-8 text-xs">
              Load
            </Button>
          </form>

          <div className="flex items-center gap-2">
            {data && (
              <span className="text-xs text-muted-foreground">
                {cached ? "cached · " : ""}
                {fromNow(data.fetchedAt)}
              </span>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => fetchData(activeAddress, true)}
              disabled={loading}
              className="h-8 gap-1"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 py-6 space-y-6">
        {/* Address info */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-muted/30 border border-border rounded-lg px-3 py-2">
            <span className="text-xs text-muted-foreground">Address:</span>
            <span className="font-mono text-sm text-foreground">
              {shortHash(activeAddress, 10, 8)}
            </span>
            <button
              onClick={copyAddress}
              className="opacity-50 hover:opacity-100 transition-opacity"
              title="Copy address"
            >
              <Copy className={`h-3.5 w-3.5 ${addressCopied ? "text-emerald-400" : ""}`} />
            </button>
            <a
              href={explorerAddressUrl(DASHBOARD_CONFIG.explorerBaseUrl, activeAddress)}
              target="_blank"
              rel="noopener noreferrer"
              className="opacity-50 hover:opacity-100 transition-opacity"
              title="View on Hyperscan"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>

          {data && (
            <span className="text-xs text-muted-foreground">
              {data.totalTxFetched} tx fetched
              {data.summary.uniqueContractsInteracted.length > 0 &&
                ` · ${data.summary.uniqueContractsInteracted.length} contract(s)`}
            </span>
          )}
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-24 gap-3 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="text-sm">Fetching all transactions from Hyperscan...</span>
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-destructive text-sm">Failed to load data</p>
              <p className="text-xs text-muted-foreground mt-1">{error}</p>
              <p className="text-xs text-muted-foreground mt-2">
                Ensure{" "}
                <code className="font-mono bg-muted px-1 rounded">
                  NEXT_PUBLIC_BLOCKSCOUT_API_BASE_URL
                </code>{" "}
                is correct and the Hyperscan API is accessible.
              </p>
              <Button
                size="sm"
                variant="outline"
                className="mt-3"
                onClick={() => fetchData(activeAddress, true)}
              >
                Retry
              </Button>
            </div>
          </div>
        )}

        {/* Data state */}
        {!loading && !error && data && (
          <>
            {/* Non-fatal errors */}
            {data.errors.length > 0 && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-amber-300">
                  <strong>Partial data:</strong> {data.errors.length} non-fatal error(s) occurred.
                  <ul className="mt-1 space-y-0.5 text-amber-400/80">
                    {data.errors.slice(0, 3).map((e, i) => (
                      <li key={i}>• {e}</li>
                    ))}
                    {data.errors.length > 3 && (
                      <li>• …and {data.errors.length - 3} more</li>
                    )}
                  </ul>
                </div>
              </div>
            )}

            {/* A. Summary Cards */}
            <section>
              <SectionHeader title="Overview" />
              <SummaryCards summary={data.summary} />
            </section>

            <Separator />

            {/* Tabs: Unstaking + History */}
            <Tabs defaultValue="history">
              <TabsList className="mb-4">
                <TabsTrigger value="unstaking">
                  Unstaking
                  {data.unstakingRequests.length > 0 && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {data.unstakingRequests.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="history">
                  Full History
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {stakingActions.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="all">
                  All Txs
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {allActions.length}
                  </Badge>
                </TabsTrigger>
              </TabsList>

              {/* B. Unstaking Pending */}
              <TabsContent value="unstaking">
                <SectionHeader
                  title="Unstaking Requests"
                  subtitle="All unstake requests with claim status and matching"
                />
                <UnstakingTable
                  requests={data.unstakingRequests}
                  onSelectRequest={handleSelectRequest}
                />
              </TabsContent>

              {/* C. Staking History */}
              <TabsContent value="history">
                <SectionHeader
                  title="Staking History"
                  subtitle="Classified staking actions only (non-staking tx hidden)"
                />
                <div className="space-y-4">
                  <FiltersBar filters={filters} onChange={setFilters} />
                  <HistoryTable
                    actions={stakingActions}
                    filters={filters}
                    onSelectAction={handleSelectAction}
                  />
                </div>
              </TabsContent>

              {/* All txs tab */}
              <TabsContent value="all">
                <SectionHeader
                  title="All Transactions"
                  subtitle="Complete tx list including non-staking"
                />
                <div className="space-y-4">
                  <FiltersBar filters={filters} onChange={setFilters} />
                  <HistoryTable
                    actions={allActions}
                    filters={filters}
                    onSelectAction={handleSelectAction}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}

        {/* Empty state */}
        {!loading && !error && !data && (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
            <CheckCircle2 className="h-10 w-10 opacity-30" />
            <p className="text-sm">Enter an address to load staking data</p>
          </div>
        )}
      </main>

      {/* D. Transaction detail drawer */}
      <TxDetailDrawer
        action={selectedAction}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  );
}

// ─────────────────────────────────────────────
// Section header
// ─────────────────────────────────────────────

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
    </div>
  );
}
