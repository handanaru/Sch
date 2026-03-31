// Core domain types for the staking dashboard

export type ActionType =
  | "stake"
  | "unstake_request"
  | "unstake_claim"
  | "withdraw"
  | "restake"
  | "redelegate"
  | "reward_claim"
  | "staking_related_unknown"
  | "non_staking";

export type ConfidenceLevel = "high" | "medium" | "low";

export type TxStatus = "ok" | "error" | "pending";

export type UnstakeStatus =
  | "pending"    // request submitted, not yet claimable
  | "claimable"  // unlock period passed, can be claimed
  | "claimed"    // successfully claimed/withdrawn
  | "failed"     // tx failed
  | "unknown";

export type MatchMethod =
  | "request_id"       // matched via explicit on-chain request id
  | "event_data"       // matched via event log data
  | "amount_and_time"  // heuristic: same amount, closest time after request
  | "amount_exact"     // same amount, first available claim
  | "manual"           // manually designated
  | "none";            // unmatched

// ─────────────────────────────────────────────
// Raw → Normalized transaction (after fetch)
// ─────────────────────────────────────────────

export interface TokenTransfer {
  tokenAddress: string;
  tokenSymbol: string | null;
  tokenName: string | null;
  tokenDecimals: number;
  from: string;
  to: string;
  rawAmount: string;
  formattedAmount: string;
  direction: "in" | "out" | "internal"; // relative to target address
}

export interface LogEntry {
  address: string;
  topics: string[];
  data: string;
  index: number;
  decodedEvent: string | null;
  decodedParams: Record<string, string> | null;
}

export interface NormalizedTx {
  hash: string;
  timestamp: string;      // ISO8601
  timestampMs: number;    // ms epoch
  blockNumber: number;
  from: string;
  to: string | null;
  value: string;          // wei string
  formattedValue: string; // e.g. "1.5 HYPE"
  method: string | null;
  methodId: string | null; // first 4 bytes of input, 0x prefixed
  rawInput: string;
  status: TxStatus;
  txTypes: string[];
  gasUsed: string | null;
  gasPrice: string | null;
  decodedMethod: string | null;       // decoded function call string
  decodedParams: Record<string, unknown> | null;
  tokenTransfers: TokenTransfer[];
  logs: LogEntry[];
  // populated on demand
  hasInternalTxs?: boolean;
  revertReason?: string | null;
}

// ─────────────────────────────────────────────
// Classified staking action
// ─────────────────────────────────────────────

export interface ClassifiedStakingAction {
  tx: NormalizedTx;
  actionType: ActionType;
  amount: string;          // formatted human-readable amount
  amountWei: string;       // raw wei
  tokenSymbol: string;     // "HYPE" or ERC20 symbol
  status: TxStatus;
  confidence: ConfidenceLevel;
  classifierReason: string; // why this classification was chosen
  parserSource: "method_name" | "method_id" | "event_log" | "value_flow" | "heuristic" | "unknown";
  contractAddress: string | null; // staking contract interacted with
  validatorAddress?: string | null;
  // populated after matching
  matchedRequestTxHash?: string | null;
  matchedClaimTxHash?: string | null;
  matchingMethod?: MatchMethod;
  matchingConfidence?: ConfidenceLevel;
  matchingNotes?: string;
}

// ─────────────────────────────────────────────
// Unstake request lifecycle
// ─────────────────────────────────────────────

export interface StakingRequest {
  id: string;                       // generated: `${hash}_unstake`
  requestTxHash: string;
  requestTimestamp: string;
  requestTimestampMs: number;
  requestAmountWei: string;
  requestAmountFormatted: string;
  tokenSymbol: string;
  contractAddress: string | null;
  status: UnstakeStatus;
  estimatedUnlockMs: number | null;  // null if unknown unlock delay
  claimTxHash: string | null;
  claimTimestamp: string | null;
  claimAmountFormatted: string | null;
  matchingMethod: MatchMethod;
  matchingConfidence: ConfidenceLevel;
  matchingNotes: string;
  blockNumber: number;
  validatorAddress?: string | null;
}

// ─────────────────────────────────────────────
// Aggregated summary
// ─────────────────────────────────────────────

export interface DashboardSummary {
  activeStakedWei: string;
  activeStakedFormatted: string;
  unstakingPendingWei: string;
  unstakingPendingFormatted: string;
  totalClaimedWei: string;
  totalClaimedFormatted: string;
  totalHistoricalStakedWei: string;
  totalHistoricalStakedFormatted: string;
  totalHistoricalUnstakeRequestedWei: string;
  totalHistoricalUnstakeRequestedFormatted: string;
  totalRequestCount: number;
  totalStakeCount: number;
  totalClaimCount: number;
  lastActivityTime: string | null; // ISO8601
  lastActivityTimeMs: number | null;
  uniqueContractsInteracted: string[];
  tokenSymbol: string;
}

// ─────────────────────────────────────────────
// Filter state (client-side)
// ─────────────────────────────────────────────

export interface FilterState {
  dateFrom: string | null;  // ISO date string
  dateTo: string | null;
  actionTypes: ActionType[];
  statuses: TxStatus[];
  txHashSearch: string;
  minAmount: string;
  maxAmount: string;
  onlyUnmatched: boolean;
  onlyFailed: boolean;
}

export const DEFAULT_FILTER_STATE: FilterState = {
  dateFrom: null,
  dateTo: null,
  actionTypes: [],
  statuses: [],
  txHashSearch: "",
  minAmount: "",
  maxAmount: "",
  onlyUnmatched: false,
  onlyFailed: false,
};

// ─────────────────────────────────────────────
// Full dashboard data payload
// ─────────────────────────────────────────────

export interface DashboardData {
  address: string;
  summary: DashboardSummary;
  actions: ClassifiedStakingAction[];
  unstakingRequests: StakingRequest[];
  fetchedAt: string; // ISO8601
  totalTxFetched: number;
  errors: string[];
}

// ─────────────────────────────────────────────
// API response types
// ─────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  cached: boolean;
  fetchedAt: string;
}
