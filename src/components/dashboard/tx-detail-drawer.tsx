"use client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ClassifiedStakingAction } from "@/lib/staking/types";
import { ActionTypeBadge, TxStatusBadge, ConfidenceBadge } from "./status-badge";
import { formatTimestamp } from "@/lib/utils/time";
import { shortHash, explorerTxUrl, explorerAddressUrl, copyToClipboard } from "@/lib/utils/tx";
import { DASHBOARD_CONFIG } from "@/config/dashboard";
import { Copy, ExternalLink } from "lucide-react";
import { useState } from "react";

interface Props {
  action: ClassifiedStakingAction | null;
  open: boolean;
  onClose: () => void;
}

export function TxDetailDrawer({ action, open, onClose }: Props) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  async function copy(text: string, field: string) {
    await copyToClipboard(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1500);
  }

  if (!action) return null;

  const tx = action.tx;
  const explorerBase = DASHBOARD_CONFIG.explorerBaseUrl;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="overflow-y-auto w-full sm:max-w-2xl">
        <SheetHeader className="mb-4">
          <SheetTitle className="flex items-center gap-2 text-base">
            Transaction Detail
          </SheetTitle>
          <SheetDescription className="font-mono text-xs break-all">
            {tx.hash}
          </SheetDescription>
        </SheetHeader>

        {/* Classification */}
        <Section title="Classification">
          <Row label="Action Type">
            <ActionTypeBadge actionType={action.actionType} />
          </Row>
          <Row label="Amount">
            <span className="font-medium">{action.amount}</span>
          </Row>
          <Row label="Tx Status">
            <TxStatusBadge status={action.status} />
          </Row>
          <Row label="Confidence">
            <ConfidenceBadge confidence={action.confidence} />
          </Row>
          <Row label="Classifier Reason">
            <span className="text-xs text-muted-foreground">{action.classifierReason}</span>
          </Row>
          <Row label="Parser Source">
            <Badge variant="outline" className="text-xs">
              {action.parserSource}
            </Badge>
          </Row>
        </Section>

        <Separator className="my-4" />

        {/* Transaction Info */}
        <Section title="Transaction">
          <Row label="Hash">
            <div className="flex items-center gap-1">
              <span className="font-mono text-xs break-all">{shortHash(tx.hash, 12, 8)}</span>
              <IconBtn
                icon={<Copy className="h-3 w-3" />}
                onClick={() => copy(tx.hash, "hash")}
                active={copiedField === "hash"}
              />
              <a
                href={explorerTxUrl(explorerBase, tx.hash)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <IconBtn icon={<ExternalLink className="h-3 w-3" />} />
              </a>
            </div>
          </Row>
          <Row label="Block">
            <span className="font-mono">{tx.blockNumber.toLocaleString()}</span>
          </Row>
          <Row label="Timestamp">
            <span>{formatTimestamp(tx.timestamp)}</span>
          </Row>
          <Row label="From">
            <HashWithActions
              hash={tx.from}
              explorerUrl={explorerAddressUrl(explorerBase, tx.from)}
              onCopy={() => copy(tx.from, "from")}
              copied={copiedField === "from"}
            />
          </Row>
          {tx.to && (
            <Row label="To">
              <HashWithActions
                hash={tx.to}
                explorerUrl={explorerAddressUrl(explorerBase, tx.to)}
                onCopy={() => copy(tx.to!, "to")}
                copied={copiedField === "to"}
              />
            </Row>
          )}
          <Row label="Value">
            <span>{tx.formattedValue}</span>
          </Row>
          <Row label="Method">
            <span className="font-mono text-xs">{tx.method ?? "—"}</span>
          </Row>
          <Row label="Method ID">
            <span className="font-mono text-xs">{tx.methodId ?? "—"}</span>
          </Row>
          {tx.decodedMethod && (
            <Row label="Decoded Call">
              <span className="font-mono text-xs break-all text-muted-foreground">
                {tx.decodedMethod}
              </span>
            </Row>
          )}
          {tx.revertReason && (
            <Row label="Revert Reason">
              <span className="text-xs text-destructive">{tx.revertReason}</span>
            </Row>
          )}
        </Section>

        {/* Decoded params */}
        {tx.decodedParams && Object.keys(tx.decodedParams).length > 0 && (
          <>
            <Separator className="my-4" />
            <Section title="Decoded Parameters">
              {Object.entries(tx.decodedParams).map(([k, v]) => (
                <Row key={k} label={k}>
                  <span className="font-mono text-xs break-all text-muted-foreground">
                    {String(v)}
                  </span>
                </Row>
              ))}
            </Section>
          </>
        )}

        {/* Token Transfers */}
        {tx.tokenTransfers.length > 0 && (
          <>
            <Separator className="my-4" />
            <Section title={`Token Transfers (${tx.tokenTransfers.length})`}>
              {tx.tokenTransfers.map((t, i) => (
                <div key={i} className="text-xs bg-muted/30 rounded-md p-2 space-y-1 mb-2">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        t.direction === "in"
                          ? "success"
                          : t.direction === "out"
                          ? "warning"
                          : "muted"
                      }
                      className="text-xs"
                    >
                      {t.direction.toUpperCase()}
                    </Badge>
                    <span className="font-medium">{t.formattedAmount}</span>
                  </div>
                  <div className="text-muted-foreground">
                    {shortHash(t.from)} → {shortHash(t.to)}
                  </div>
                  {t.tokenAddress && (
                    <div className="text-muted-foreground font-mono">{shortHash(t.tokenAddress)}</div>
                  )}
                </div>
              ))}
            </Section>
          </>
        )}

        {/* Event Logs */}
        {tx.logs.length > 0 && (
          <>
            <Separator className="my-4" />
            <Section title={`Event Logs (${tx.logs.length})`}>
              {tx.logs.map((log, i) => (
                <div key={i} className="text-xs bg-muted/30 rounded-md p-2 space-y-1 mb-2">
                  {log.decodedEvent && (
                    <div className="font-medium text-foreground">{log.decodedEvent}</div>
                  )}
                  <div className="text-muted-foreground font-mono">
                    Contract: {shortHash(log.address)}
                  </div>
                  {log.topics.map((topic, j) => (
                    <div key={j} className="font-mono text-muted-foreground truncate">
                      topic{j}: {shortHash(topic, 10, 6)}
                    </div>
                  ))}
                  {log.decodedParams && Object.keys(log.decodedParams).length > 0 && (
                    <div className="mt-1 space-y-0.5">
                      {Object.entries(log.decodedParams).map(([k, v]) => (
                        <div key={k} className="flex gap-2">
                          <span className="text-muted-foreground">{k}:</span>
                          <span className="font-mono truncate">{v}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </Section>
          </>
        )}

        {/* Matching info */}
        {(action.matchedRequestTxHash || action.matchedClaimTxHash) && (
          <>
            <Separator className="my-4" />
            <Section title="Matching">
              {action.matchedRequestTxHash && (
                <Row label="Matched Request">
                  <HashWithActions
                    hash={action.matchedRequestTxHash}
                    explorerUrl={explorerTxUrl(explorerBase, action.matchedRequestTxHash)}
                    onCopy={() => copy(action.matchedRequestTxHash!, "req")}
                    copied={copiedField === "req"}
                  />
                </Row>
              )}
              {action.matchedClaimTxHash && (
                <Row label="Matched Claim">
                  <HashWithActions
                    hash={action.matchedClaimTxHash}
                    explorerUrl={explorerTxUrl(explorerBase, action.matchedClaimTxHash)}
                    onCopy={() => copy(action.matchedClaimTxHash!, "claim")}
                    copied={copiedField === "claim"}
                  />
                </Row>
              )}
              {action.matchingMethod && (
                <Row label="Match Method">
                  <Badge variant="outline" className="text-xs capitalize">
                    {action.matchingMethod.replace(/_/g, " ")}
                  </Badge>
                </Row>
              )}
              {action.matchingNotes && (
                <Row label="Match Notes">
                  <span className="text-xs text-muted-foreground">{action.matchingNotes}</span>
                </Row>
              )}
            </Section>
          </>
        )}

        {/* Raw calldata */}
        {tx.rawInput && tx.rawInput !== "0x" && (
          <>
            <Separator className="my-4" />
            <Section title="Raw Input">
              <div className="bg-muted/30 rounded-md p-2">
                <div className="flex justify-end mb-1">
                  <IconBtn
                    icon={<Copy className="h-3 w-3" />}
                    onClick={() => copy(tx.rawInput, "input")}
                    active={copiedField === "input"}
                    label="Copy"
                  />
                </div>
                <div className="font-mono text-xs text-muted-foreground break-all max-h-32 overflow-y-auto">
                  {tx.rawInput}
                </div>
              </div>
            </Section>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {title}
      </h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <span className="text-muted-foreground text-xs w-32 flex-shrink-0 pt-0.5">{label}</span>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

function HashWithActions({
  hash,
  explorerUrl,
  onCopy,
  copied,
}: {
  hash: string;
  explorerUrl: string;
  onCopy: () => void;
  copied: boolean;
}) {
  return (
    <div className="flex items-center gap-1">
      <span className="font-mono text-xs break-all">{shortHash(hash, 10, 6)}</span>
      <button onClick={onCopy} className="opacity-50 hover:opacity-100 flex-shrink-0">
        <Copy className={`h-3 w-3 ${copied ? "text-emerald-400" : ""}`} />
      </button>
      <a
        href={explorerUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="opacity-50 hover:opacity-100 flex-shrink-0"
      >
        <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  );
}

function IconBtn({
  icon,
  onClick,
  active,
  label,
}: {
  icon: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  label?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 opacity-60 hover:opacity-100 transition-opacity text-xs ${
        active ? "text-emerald-400 opacity-100" : ""
      }`}
    >
      {icon}
      {label && <span>{label}</span>}
    </button>
  );
}
