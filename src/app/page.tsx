"use client";

import { useState, useEffect, useCallback } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { HoldersTable, type HolderRow } from "@/components/dashboard/holders-table";
import { TransfersTable } from "@/components/dashboard/transfers-table";
import type { NormalizedTransfer } from "@/app/api/token/transfers/route";
import { DASHBOARD_CONFIG } from "@/config/dashboard";
import { shortHash, explorerAddressUrl, copyToClipboard } from "@/lib/utils/tx";
import { fromNow } from "@/lib/utils/time";
import { weiToFormatted } from "@/lib/utils/amount";
import {
  RefreshCw, Copy, ExternalLink, Loader2, AlertCircle,
  Users, ArrowLeftRight, TrendingUp, Coins,
} from "lucide-react";

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────

interface TokenInfo {
  name: string | null;
  symbol: string | null;
  decimals: string | null;
  total_supply: string | null;
}

interface HoldersData {
  holders: HolderRow[];
  tokenInfo: TokenInfo;
  errors: string[];
  fetchedAt: string;
}

interface TransfersData {
  transfers: NormalizedTransfer[];
  errors: string[];
  fetchedAt: string;
}

// ─────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [contractInput, setContractInput] = useState(DASHBOARD_CONFIG.targetAddress);
  const [activeContract, setActiveContract] = useState(DASHBOARD_CONFIG.targetAddress);

  const [holdersData, setHoldersData] = useState<HoldersData | null>(null);
  const [transfersData, setTransfersData] = useState<TransfersData | null>(null);
  const [loadingHolders, setLoadingHolders] = useState(false);
  const [loadingTransfers, setLoadingTransfers] = useState(false);
  const [errorHolders, setErrorHolders] = useState<string | null>(null);
  const [errorTransfers, setErrorTransfers] = useState<string | null>(null);

  // Selected address for drilldown
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [addressTransfers, setAddressTransfers] = useState<TransfersData | null>(null);
  const [loadingAddrTransfers, setLoadingAddrTransfers] = useState(false);

  const [contractCopied, setContractCopied] = useState(false);

  // ── Fetch holders ──
  const fetchHolders = useCallback(async (contract: string, force = false) => {
    setLoadingHolders(true);
    setErrorHolders(null);
    try {
      const qs = new URLSearchParams({ contract });
      if (force) qs.set("force", "1");
      const res = await fetch(`/api/token/holders?${qs}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setHoldersData(json.data);
    } catch (err) {
      setErrorHolders(err instanceof Error ? err.message : String(err));
    } finally {
      setLoadingHolders(false);
    }
  }, []);

  // ── Fetch all transfers ──
  const fetchTransfers = useCallback(async (contract: string, force = false) => {
    setLoadingTransfers(true);
    setErrorTransfers(null);
    try {
      const qs = new URLSearchParams({ contract });
      if (force) qs.set("force", "1");
      const res = await fetch(`/api/token/transfers?${qs}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setTransfersData(json.data);
    } catch (err) {
      setErrorTransfers(err instanceof Error ? err.message : String(err));
    } finally {
      setLoadingTransfers(false);
    }
  }, []);

  // ── Fetch transfers for a specific address ──
  const fetchAddressTransfers = useCallback(async (contract: string, address: string) => {
    setLoadingAddrTransfers(true);
    try {
      const qs = new URLSearchParams({ contract, address });
      const res = await fetch(`/api/token/transfers?${qs}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setAddressTransfers(json.data);
    } catch (err) {
      setAddressTransfers(null);
    } finally {
      setLoadingAddrTransfers(false);
    }
  }, []);

  useEffect(() => {
    fetchHolders(activeContract);
    fetchTransfers(activeContract);
  }, [activeContract, fetchHolders, fetchTransfers]);

  useEffect(() => {
    if (selectedAddress) {
      fetchAddressTransfers(activeContract, selectedAddress);
    }
  }, [selectedAddress, activeContract, fetchAddressTransfers]);

  function handleContractSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (contractInput.trim()) {
      setActiveContract(contractInput.trim().toLowerCase());
      setSelectedAddress(null);
      setAddressTransfers(null);
    }
  }

  async function copyContract() {
    await copyToClipboard(activeContract);
    setContractCopied(true);
    setTimeout(() => setContractCopied(false), 1500);
  }

  function refresh() {
    fetchHolders(activeContract, true);
    fetchTransfers(activeContract, true);
    if (selectedAddress) fetchAddressTransfers(activeContract, selectedAddress);
  }

  const tokenInfo = holdersData?.tokenInfo ?? null;
  const symbol = tokenInfo?.symbol ?? DASHBOARD_CONFIG.nativeSymbol;
  const decimals = parseInt(tokenInfo?.decimals ?? "18");
  const holders = holdersData?.holders ?? [];
  const transfers = transfersData?.transfers ?? [];

  // Summary stats
  const totalHolders = holders.length;
  const topHolder = holders[0] ?? null;
  const totalSupply = tokenInfo?.total_supply ?? null;
  const totalTransfers = transfers.length;
  // Volume: sum of all transfer amounts
  const totalVolumeWei = transfers.reduce((acc, t) => {
    try { return (BigInt(acc) + BigInt(t.rawAmount)).toString(); } catch { return acc; }
  }, "0");

  const loading = loadingHolders || loadingTransfers;
  const fetchedAt = holdersData?.fetchedAt ?? transfersData?.fetchedAt ?? null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur sticky top-0 z-30">
        <div className="max-w-[1600px] mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="text-lg font-bold">HyperEVM Token Dashboard</div>
            <Badge variant="secondary" className="text-xs">{DASHBOARD_CONFIG.chainName}</Badge>
            {symbol && <Badge variant="outline" className="text-xs font-mono">{symbol}</Badge>}
          </div>

          {/* Contract input */}
          <form onSubmit={handleContractSubmit} className="flex items-center gap-2 flex-1 max-w-xl">
            <input
              value={contractInput}
              onChange={(e) => setContractInput(e.target.value)}
              placeholder="Token contract address 0x..."
              className="flex-1 h-8 bg-muted border border-border rounded-md px-3 text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <Button type="submit" size="sm" variant="outline" className="h-8 text-xs">Load</Button>
          </form>

          <div className="flex items-center gap-2">
            {fetchedAt && (
              <span className="text-xs text-muted-foreground">{fromNow(fetchedAt)}</span>
            )}
            <Button size="sm" variant="outline" onClick={refresh} disabled={loading} className="h-8 gap-1">
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 py-6 space-y-6">
        {/* Contract address bar */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-muted/30 border border-border rounded-lg px-3 py-2">
            <span className="text-xs text-muted-foreground">Contract:</span>
            <span className="font-mono text-sm">{shortHash(activeContract, 12, 8)}</span>
            {tokenInfo?.name && (
              <span className="text-xs text-muted-foreground">({tokenInfo.name})</span>
            )}
            <button onClick={copyContract} className="opacity-50 hover:opacity-100 transition-opacity">
              <Copy className={`h-3.5 w-3.5 ${contractCopied ? "text-emerald-400" : ""}`} />
            </button>
            <a
              href={explorerAddressUrl(DASHBOARD_CONFIG.explorerBaseUrl, activeContract)}
              target="_blank" rel="noopener noreferrer"
              className="opacity-50 hover:opacity-100 transition-opacity"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20 gap-3 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="text-sm">Fetching token data from Hyperscan...</span>
          </div>
        )}

        {/* Error */}
        {!loading && (errorHolders || errorTransfers) && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-5 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-medium text-destructive text-sm">Failed to load token data</p>
              {errorHolders && <p className="text-xs text-muted-foreground">Holders: {errorHolders}</p>}
              {errorTransfers && <p className="text-xs text-muted-foreground">Transfers: {errorTransfers}</p>}
              <p className="text-xs text-muted-foreground mt-2">
                Ensure the contract address is correct and Hyperscan API is reachable.
              </p>
              <Button size="sm" variant="outline" className="mt-2" onClick={refresh}>Retry</Button>
            </div>
          </div>
        )}

        {!loading && !errorHolders && !errorTransfers && (holdersData || transfersData) && (
          <>
            {/* ── Summary Cards ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={<Users className="h-4 w-4 text-blue-400" />}
                title="Total Holders"
                value={totalHolders.toLocaleString()}
                sub="unique addresses"
              />
              <StatCard
                icon={<Coins className="h-4 w-4 text-emerald-400" />}
                title="Total Supply"
                value={totalSupply ? weiToFormatted(totalSupply, decimals, symbol) : "—"}
                sub={`${symbol} token`}
              />
              <StatCard
                icon={<ArrowLeftRight className="h-4 w-4 text-purple-400" />}
                title="Total Transfers"
                value={totalTransfers.toLocaleString()}
                sub="token movements"
              />
              <StatCard
                icon={<TrendingUp className="h-4 w-4 text-amber-400" />}
                title="Top Holder"
                value={topHolder ? shortHash(topHolder.address, 8, 6) : "—"}
                sub={topHolder ? weiToFormatted(topHolder.rawBalance, decimals, symbol) : ""}
                mono
              />
            </div>

            <Separator />

            {/* ── Main Tabs ── */}
            <Tabs defaultValue="holders">
              <TabsList>
                <TabsTrigger value="holders">
                  Holders
                  {totalHolders > 0 && (
                    <Badge variant="secondary" className="ml-2 text-xs">{totalHolders.toLocaleString()}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="transfers">
                  All Transfers
                  {totalTransfers > 0 && (
                    <Badge variant="secondary" className="ml-2 text-xs">{totalTransfers.toLocaleString()}</Badge>
                  )}
                </TabsTrigger>
                {selectedAddress && (
                  <TabsTrigger value="address">
                    <span className="font-mono">{shortHash(selectedAddress)}</span>
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {addressTransfers?.transfers.length ?? "…"}
                    </Badge>
                  </TabsTrigger>
                )}
              </TabsList>

              {/* ── Holders Tab ── */}
              <TabsContent value="holders" className="mt-4">
                <SectionHeader
                  title="Token Holders"
                  subtitle={`All ${symbol} holders sorted by balance. Click a row to see their transfer history.`}
                />
                {loadingHolders ? (
                  <LoadingRow text="Fetching holders..." />
                ) : holders.length === 0 ? (
                  <EmptyRow text="No holders found" />
                ) : (
                  <HoldersTable
                    holders={holders}
                    tokenInfo={tokenInfo}
                    onSelectAddress={setSelectedAddress}
                    selectedAddress={selectedAddress}
                  />
                )}
              </TabsContent>

              {/* ── All Transfers Tab ── */}
              <TabsContent value="transfers" className="mt-4">
                <SectionHeader
                  title="All Token Transfers"
                  subtitle="Complete transfer history showing how token amounts move between addresses"
                />
                {loadingTransfers ? (
                  <LoadingRow text="Fetching transfers..." />
                ) : transfers.length === 0 ? (
                  <EmptyRow text="No transfers found" />
                ) : (
                  <TransfersTable
                    transfers={transfers}
                    highlightAddress={selectedAddress ?? undefined}
                    onSelectAddress={setSelectedAddress}
                  />
                )}
              </TabsContent>

              {/* ── Address Drilldown Tab ── */}
              {selectedAddress && (
                <TabsContent value="address" className="mt-4">
                  <AddressDrilldown
                    address={selectedAddress}
                    contract={activeContract}
                    holders={holders}
                    tokenInfo={tokenInfo}
                    transfers={addressTransfers?.transfers ?? []}
                    loading={loadingAddrTransfers}
                    onClose={() => setSelectedAddress(null)}
                    onSelectAddress={setSelectedAddress}
                  />
                </TabsContent>
              )}
            </Tabs>
          </>
        )}
      </main>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Address drilldown panel
// ─────────────────────────────────────────────────────────

function AddressDrilldown({
  address, contract, holders, tokenInfo, transfers, loading, onClose, onSelectAddress,
}: {
  address: string;
  contract: string;
  holders: HolderRow[];
  tokenInfo: TokenInfo | null;
  transfers: NormalizedTransfer[];
  loading: boolean;
  onClose: () => void;
  onSelectAddress: (addr: string) => void;
}) {
  const symbol = tokenInfo?.symbol ?? DASHBOARD_CONFIG.nativeSymbol;
  const decimals = parseInt(tokenInfo?.decimals ?? "18");
  const holder = holders.find((h) => h.address === address);

  const sent = transfers.filter((t) => t.from === address);
  const received = transfers.filter((t) => t.to === address);

  const sentWei = sent.reduce((a, t) => { try { return (BigInt(a) + BigInt(t.rawAmount)).toString(); } catch { return a; } }, "0");
  const receivedWei = received.reduce((a, t) => { try { return (BigInt(a) + BigInt(t.rawAmount)).toString(); } catch { return a; } }, "0");

  return (
    <div className="space-y-4">
      {/* Address header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-muted/30 border border-border rounded-lg px-3 py-2">
            <span className="text-xs text-muted-foreground">Address:</span>
            <span className="font-mono text-sm">{shortHash(address, 12, 8)}</span>
            <a
              href={explorerAddressUrl(DASHBOARD_CONFIG.explorerBaseUrl, address)}
              target="_blank" rel="noopener noreferrer"
              className="opacity-50 hover:opacity-100"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
          {holder && (
            <>
              <div className="text-sm font-medium">
                Rank <span className="text-amber-400">#{holder.rank}</span>
              </div>
              <div className="text-sm font-medium font-mono">
                Balance: {weiToFormatted(holder.rawBalance, decimals, symbol)}
              </div>
            </>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={onClose}>✕ Close</Button>
      </div>

      {/* Mini stats */}
      <div className="grid grid-cols-3 gap-3">
        <MiniStat label="Total Received" value={weiToFormatted(receivedWei, decimals, symbol)} color="text-emerald-400" />
        <MiniStat label="Total Sent" value={weiToFormatted(sentWei, decimals, symbol)} color="text-rose-400" />
        <MiniStat label="Transfers" value={transfers.length.toString()} />
      </div>

      {/* Transfer history */}
      <SectionHeader title="Transfer History" subtitle="All sends and receives for this address" />
      {loading ? (
        <LoadingRow text="Fetching address transfers..." />
      ) : transfers.length === 0 ? (
        <EmptyRow text="No transfers found for this address" />
      ) : (
        <TransfersTable
          transfers={transfers}
          highlightAddress={address}
          onSelectAddress={onSelectAddress}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────

function StatCard({
  icon, title, value, sub, mono,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  sub?: string;
  mono?: boolean;
}) {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className={`text-xl font-bold truncate ${mono ? "font-mono" : ""}`} title={value}>
          {value}
        </div>
        {sub && <p className="text-xs text-muted-foreground mt-1 truncate">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function MiniStat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-muted/30 border border-border rounded-lg px-4 py-3">
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className={`text-sm font-bold font-mono ${color ?? "text-foreground"}`}>{value}</div>
    </div>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
    </div>
  );
}

function LoadingRow({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center py-16 gap-3 text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin" />
      <span className="text-sm">{text}</span>
    </div>
  );
}

function EmptyRow({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
      {text}
    </div>
  );
}
