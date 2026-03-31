// Dashboard configuration — swap these values to reuse with another address/chain

export const DASHBOARD_CONFIG = {
  // Target wallet address
  targetAddress:
    process.env.NEXT_PUBLIC_TARGET_ADDRESS ||
    "0x053f6755320d06b8fd6675581b0475b2e32399b1",

  // Explorer base URL (used for external links)
  explorerBaseUrl:
    process.env.NEXT_PUBLIC_EXPLORER_BASE_URL || "https://www.hyperscan.com",

  // Blockscout v2 API base URL
  apiBaseUrl:
    process.env.NEXT_PUBLIC_BLOCKSCOUT_API_BASE_URL ||
    "https://www.hyperscan.com/api/v2",

  // Chain name shown in UI
  chainName: process.env.NEXT_PUBLIC_CHAIN_NAME || "HyperEVM",

  // Native token symbol
  nativeSymbol: "HYPE",

  // Native token decimals
  nativeDecimals: 18,

  // Approximate unlock delay in ms after unstake request
  // HyperEVM staking: if the unlock epoch/delay is known, set it here.
  // 7 days = 604800000ms — placeholder, update with actual chain parameter
  unstakeUnlockDelayMs: 7 * 24 * 60 * 60 * 1000, // 7 days

  // Known staking contract addresses on HyperEVM
  // These are best-effort; update with verified addresses
  // NOTE: HyperEVM uses system precompile 0x0000...0800 range for staking
  knownStakingContracts: [
    // Hyperliquid staking precompile addresses (to be verified)
    "0x0000000000000000000000000000000000000800",
    "0x0000000000000000000000000000000000000801",
    "0x0000000000000000000000000000000000000802",
    // Add verified staking contract addresses here
  ] as string[],

  // Items per page for table display
  pageSize: 25,

  // Max total transactions to fetch (pagination cap)
  maxFetchLimit: 5000,

  // Request timeout in ms
  fetchTimeoutMs: 15000,

  // Retry config
  maxRetries: 3,
  retryDelayMs: 1000,
} as const;

export type DashboardConfig = typeof DASHBOARD_CONFIG;
