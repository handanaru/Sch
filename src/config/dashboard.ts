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

  // Native token symbol — set via env or auto-detected from token transfers
  // If the staking token is an ERC20 (e.g. "based"), this will be overridden
  // by actual token transfer data in the classifier.
  nativeSymbol: process.env.NEXT_PUBLIC_NATIVE_SYMBOL || "HYPE",

  // Primary staking token symbol (ERC20 if different from native)
  // Set this if the staking token is NOT the native gas token.
  // e.g. "based" for the based token on HyperEVM
  stakingTokenSymbol: process.env.NEXT_PUBLIC_STAKING_TOKEN_SYMBOL || null,

  // Native token decimals
  nativeDecimals: 18,

  // Approximate unlock delay in ms after unstake request
  // HyperEVM staking: update with actual chain/protocol unlock period
  // 7 days = 604800000ms — placeholder
  unstakeUnlockDelayMs: 7 * 24 * 60 * 60 * 1000,

  // Known staking contract addresses on HyperEVM
  // Add the actual staking contract address once identified from explorer.
  // Check: https://www.hyperscan.com/address/<contract>
  knownStakingContracts: (
    process.env.NEXT_PUBLIC_STAKING_CONTRACTS?.split(",").map((s) => s.trim()) ?? []
  ) as string[],

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
