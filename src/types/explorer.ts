// Raw types from Blockscout v2 API (Hyperscan is Blockscout-based)

export interface BlockscoutAddress {
  hash: string;
  name: string | null;
  is_contract: boolean;
  is_verified?: boolean;
  implementation_name?: string | null;
}

export interface BlockscoutFee {
  type: "actual" | "maximum";
  value: string; // wei string
}

export interface BlockscoutDecodedInput {
  method_call: string;
  method_id: string;
  parameters: BlockscoutDecodedParam[];
}

export interface BlockscoutDecodedParam {
  name: string;
  type: string;
  value: string | number | boolean | object;
}

export interface BlockscoutTokenTransfer {
  token: {
    address: string;
    decimals: string | null;
    name: string | null;
    symbol: string | null;
    type: "ERC-20" | "ERC-721" | "ERC-1155" | string;
  };
  from: BlockscoutAddress;
  to: BlockscoutAddress;
  total: {
    value: string; // raw amount
    decimals: string;
  };
  type: "token_transfer" | "token_minting" | "token_burning";
  transaction_hash: string;
}

export interface BlockscoutLog {
  address: BlockscoutAddress;
  data: string;
  decoded: {
    method_call: string;
    method_id: string;
    parameters: BlockscoutDecodedParam[];
  } | null;
  index: number;
  topics: string[];
  transaction_hash: string;
}

export interface BlockscoutTransaction {
  hash: string;
  timestamp: string; // ISO8601
  block: number;
  from: BlockscoutAddress;
  to: BlockscoutAddress | null; // null for contract creation
  value: string; // wei string
  gas_price: string | null;
  gas_used: string | null;
  gas_limit: string;
  status: "ok" | "error" | null;
  method: string | null; // function name if known
  decoded_input: BlockscoutDecodedInput | null;
  tx_types: string[];
  fee: BlockscoutFee | null;
  raw_input: string; // hex calldata
  result: string | null; // revert reason if error
  revert_reason: string | null;
  type: number; // EIP-2718 tx type
  // enriched by /transactions/:hash
  token_transfers?: BlockscoutTokenTransfer[];
  logs?: BlockscoutLog[];
}

export interface BlockscoutTransactionListResponse {
  items: BlockscoutTransaction[];
  next_page_params: BlockscoutNextPageParams | null;
}

export interface BlockscoutNextPageParams {
  block_number: number;
  index: number;
  items_count: number;
  filter?: string;
}

export interface BlockscoutInternalTransaction {
  block_number: number;
  call_type: string; // "call", "staticcall", "delegatecall", "create", etc.
  error: string | null;
  from: BlockscoutAddress;
  gas_limit: string;
  index: number;
  success: boolean;
  timestamp: string;
  to: BlockscoutAddress | null;
  transaction_hash: string;
  type: string;
  value: string;
}

export interface BlockscoutInternalTxListResponse {
  items: BlockscoutInternalTransaction[];
  next_page_params: BlockscoutNextPageParams | null;
}
