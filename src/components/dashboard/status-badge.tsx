import { Badge } from "@/components/ui/badge";
import type { ActionType, UnstakeStatus, TxStatus, ConfidenceLevel } from "@/lib/staking/types";

// ─────────────────────────────────────────────
// Action type badge
// ─────────────────────────────────────────────

const ACTION_CONFIG: Record<ActionType, { label: string; variant: string }> = {
  stake: { label: "Stake", variant: "success" },
  unstake_request: { label: "Unstake Req", variant: "warning" },
  unstake_claim: { label: "Claim", variant: "info" },
  withdraw: { label: "Withdraw", variant: "info" },
  restake: { label: "Restake", variant: "success" },
  redelegate: { label: "Redelegate", variant: "secondary" },
  reward_claim: { label: "Reward Claim", variant: "info" },
  staking_related_unknown: { label: "Unknown Staking", variant: "muted" },
  non_staking: { label: "Non-Staking", variant: "outline" },
};

export function ActionTypeBadge({ actionType }: { actionType: ActionType }) {
  const cfg = ACTION_CONFIG[actionType] ?? { label: actionType, variant: "outline" };
  return (
    <Badge variant={cfg.variant as Parameters<typeof Badge>[0]["variant"]}>
      {cfg.label}
    </Badge>
  );
}

// ─────────────────────────────────────────────
// Unstake status badge
// ─────────────────────────────────────────────

const UNSTAKE_STATUS_CONFIG: Record<UnstakeStatus, { label: string; variant: string }> = {
  pending: { label: "Pending", variant: "warning" },
  claimable: { label: "Claimable", variant: "success" },
  claimed: { label: "Claimed", variant: "info" },
  failed: { label: "Failed", variant: "destructive" },
  unknown: { label: "Unknown", variant: "muted" },
};

export function UnstakeStatusBadge({ status }: { status: UnstakeStatus }) {
  const cfg = UNSTAKE_STATUS_CONFIG[status] ?? { label: status, variant: "outline" };
  return (
    <Badge variant={cfg.variant as Parameters<typeof Badge>[0]["variant"]}>
      {cfg.label}
    </Badge>
  );
}

// ─────────────────────────────────────────────
// Tx status badge
// ─────────────────────────────────────────────

export function TxStatusBadge({ status }: { status: TxStatus }) {
  if (status === "ok")
    return <Badge variant="success">Success</Badge>;
  if (status === "error")
    return <Badge variant="destructive">Failed</Badge>;
  return <Badge variant="muted">Pending</Badge>;
}

// ─────────────────────────────────────────────
// Confidence badge
// ─────────────────────────────────────────────

const CONFIDENCE_CONFIG: Record<ConfidenceLevel, { label: string; variant: string }> = {
  high: { label: "High", variant: "success" },
  medium: { label: "Medium", variant: "warning" },
  low: { label: "Low", variant: "muted" },
};

export function ConfidenceBadge({ confidence }: { confidence: ConfidenceLevel }) {
  const cfg = CONFIDENCE_CONFIG[confidence];
  return (
    <Badge variant={cfg.variant as Parameters<typeof Badge>[0]["variant"]}>
      {cfg.label}
    </Badge>
  );
}
