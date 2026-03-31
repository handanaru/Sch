/**
 * Normalizes raw Blockscout API transactions into the dashboard's NormalizedTx format.
 * This is the "raw → normalized" transform layer.
 */

import type { BlockscoutTransaction, BlockscoutTokenTransfer, BlockscoutLog } from "@/types/explorer";
import type { NormalizedTx, TokenTransfer, LogEntry } from "@/lib/staking/types";
import { DASHBOARD_CONFIG } from "@/config/dashboard";
import { KNOWN_METHOD_SIGNATURES, KNOWN_EVENT_TOPICS } from "@/config/classifier";
import { extractMethodId, normalizeAddress } from "@/lib/utils/tx";
import { weiToFormatted } from "@/lib/utils/amount";
import { toMs } from "@/lib/utils/time";

const { nativeDecimals, nativeSymbol, targetAddress } = DASHBOARD_CONFIG;

// ─────────────────────────────────────────────
// Main normalize function
// ─────────────────────────────────────────────

export function normalizeTransaction(raw: BlockscoutTransaction): NormalizedTx {
  const methodId = extractMethodId(raw.raw_input);
  const method =
    raw.method ||
    (methodId ? KNOWN_METHOD_SIGNATURES[methodId] ?? null : null);

  // Extract decoded method call string
  const decodedMethod = raw.decoded_input?.method_call ?? null;
  const decodedParams = raw.decoded_input
    ? buildDecodedParamsRecord(raw.decoded_input.parameters ?? [])
    : null;

  const tokenTransfers = normalizeTokenTransfers(
    raw.token_transfers ?? [],
    normalizeAddress(targetAddress)
  );

  const logs = normalizeLogs(raw.logs ?? []);

  const statusRaw = raw.status;
  const status =
    statusRaw === "ok"
      ? "ok"
      : statusRaw === "error"
      ? "error"
      : "pending";

  return {
    hash: raw.hash,
    timestamp: raw.timestamp,
    timestampMs: toMs(raw.timestamp),
    blockNumber: raw.block,
    from: normalizeAddress(raw.from?.hash ?? ""),
    to: raw.to ? normalizeAddress(raw.to.hash) : null,
    value: raw.value ?? "0",
    formattedValue: weiToFormatted(raw.value ?? "0", nativeDecimals, nativeSymbol),
    method: method ? stripSignature(method) : null,
    methodId,
    rawInput: raw.raw_input ?? "0x",
    status,
    txTypes: raw.tx_types ?? [],
    gasUsed: raw.gas_used ?? null,
    gasPrice: raw.gas_price ?? null,
    decodedMethod,
    decodedParams,
    tokenTransfers,
    logs,
    revertReason: raw.revert_reason ?? null,
  };
}

export function normalizeTransactions(
  raws: BlockscoutTransaction[]
): NormalizedTx[] {
  return raws.map(normalizeTransaction);
}

// ─────────────────────────────────────────────
// Token transfers
// ─────────────────────────────────────────────

function normalizeTokenTransfers(
  raw: BlockscoutTokenTransfer[],
  watchAddress: string
): TokenTransfer[] {
  return raw.map((t) => {
    const decimals = t.token.decimals ? parseInt(t.token.decimals) : 18;
    const from = normalizeAddress(t.from?.hash ?? "");
    const to = normalizeAddress(t.to?.hash ?? "");
    const rawAmount = t.total?.value ?? "0";

    let direction: "in" | "out" | "internal" = "internal";
    if (to === watchAddress) direction = "in";
    else if (from === watchAddress) direction = "out";

    return {
      tokenAddress: normalizeAddress(t.token?.address ?? ""),
      tokenSymbol: t.token?.symbol ?? null,
      tokenName: t.token?.name ?? null,
      tokenDecimals: decimals,
      from,
      to,
      rawAmount,
      formattedAmount: weiToFormatted(rawAmount, decimals, t.token?.symbol ?? ""),
      direction,
    };
  });
}

// ─────────────────────────────────────────────
// Logs
// ─────────────────────────────────────────────

function normalizeLogs(raw: BlockscoutLog[]): LogEntry[] {
  return raw.map((log) => {
    const topic0 = log.topics?.[0]?.toLowerCase() ?? null;
    const decodedEvent = topic0 ? (KNOWN_EVENT_TOPICS[topic0] ?? null) : null;
    const decodedParams = log.decoded
      ? buildDecodedParamsRecord(log.decoded.parameters ?? [])
      : null;

    return {
      address: normalizeAddress(log.address?.hash ?? ""),
      topics: log.topics ?? [],
      data: log.data ?? "0x",
      index: log.index ?? 0,
      decodedEvent,
      decodedParams,
    };
  });
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function buildDecodedParamsRecord(
  params: { name: string; value: unknown }[]
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const p of params) {
    result[p.name] = String(p.value);
  }
  return result;
}

/**
 * "stake(uint256)" → "stake"
 * "0xa694fc3a" → "0xa694fc3a" (leave as-is if no parens)
 */
function stripSignature(method: string): string {
  const idx = method.indexOf("(");
  if (idx > 0) return method.slice(0, idx);
  return method;
}
