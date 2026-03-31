"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardSummary } from "@/lib/staking/types";
import { formatTimestamp, fromNow } from "@/lib/utils/time";
import {
  Coins,
  ArrowDownCircle,
  CheckCircle2,
  History,
  Clock,
  Hash,
  Activity,
} from "lucide-react";

interface Props {
  summary: DashboardSummary;
}

interface CardDef {
  title: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  iconClass?: string;
}

export function SummaryCards({ summary }: Props) {
  const cards: CardDef[] = [
    {
      title: "Active Staked",
      value: summary.activeStakedFormatted,
      sub: "Estimated (staked − requested)",
      icon: Coins,
      iconClass: "text-emerald-400",
    },
    {
      title: "Unstaking Pending",
      value: summary.unstakingPendingFormatted,
      sub: "Requested but not yet claimed",
      icon: ArrowDownCircle,
      iconClass: "text-amber-400",
    },
    {
      title: "Total Claimed",
      value: summary.totalClaimedFormatted,
      sub: "Successfully unstaked & claimed",
      icon: CheckCircle2,
      iconClass: "text-blue-400",
    },
    {
      title: "Total Staked (All Time)",
      value: summary.totalHistoricalStakedFormatted,
      sub: `${summary.totalStakeCount} stake tx(s)`,
      icon: History,
      iconClass: "text-purple-400",
    },
    {
      title: "Total Unstake Requested",
      value: summary.totalHistoricalUnstakeRequestedFormatted,
      sub: `${summary.totalRequestCount} request(s)`,
      icon: Hash,
      iconClass: "text-rose-400",
    },
    {
      title: "Claim Count",
      value: summary.totalClaimCount.toString(),
      sub: "Successfully matched claims",
      icon: CheckCircle2,
      iconClass: "text-cyan-400",
    },
    {
      title: "Last Activity",
      value: summary.lastActivityTime
        ? fromNow(summary.lastActivityTime)
        : "—",
      sub: summary.lastActivityTime
        ? formatTimestamp(summary.lastActivityTime)
        : "No activity",
      icon: Clock,
      iconClass: "text-slate-400",
    },
    {
      title: "Contracts Interacted",
      value: summary.uniqueContractsInteracted.length.toString(),
      sub: summary.uniqueContractsInteracted.slice(0, 2).join(", ") || "None identified",
      icon: Activity,
      iconClass: "text-orange-400",
    },
  ];

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <SummaryCard key={card.title} {...card} />
      ))}
    </div>
  );
}

function SummaryCard({ title, value, sub, icon: Icon, iconClass }: CardDef) {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className={`h-4 w-4 ${iconClass ?? "text-muted-foreground"}`} />
      </CardHeader>
      <CardContent>
        <div className="text-xl font-bold text-foreground truncate" title={value}>
          {value}
        </div>
        {sub && (
          <p className="text-xs text-muted-foreground mt-1 truncate" title={sub}>
            {sub}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
