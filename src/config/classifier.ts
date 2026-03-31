// Staking classifier configuration
// Update method IDs and event topics as you discover them from the actual ABI

// ─────────────────────────────────────────────
// Known method signatures (4-byte selector → name)
// ─────────────────────────────────────────────
// To compute: keccak256("methodName(argTypes)").slice(0,4)
// These cover common staking patterns across EVM protocols.
// HyperEVM-specific selectors should be added when ABI is confirmed.

export const KNOWN_METHOD_SIGNATURES: Record<string, string> = {
  // ── Standard ERC4626 / generic staking ──
  "0xa694fc3a": "stake(uint256)",
  "0x2e17de78": "unstake(uint256)",
  "0x2e1a7d4d": "withdraw(uint256)",
  "0x4e71d92d": "claim()",
  "0x3d18b912": "getReward()",
  "0xe9fad8ee": "exit()",
  "0xd5575982": "deposit(uint256,address)",
  "0xb6b55f25": "deposit(uint256)",
  "0x6e553f65": "deposit(uint256,address)", // ERC4626
  "0xba087652": "redeem(uint256,address,address)", // ERC4626
  "0x2f4f21e2": "unstake(uint256,address)",
  "0x0fbf0a93": "withdrawRewards(address)",
  "0x51cff8d9": "withdraw(address)",
  "0xf2fde38b": "transferOwnership(address)",
  "0x4641257d": "harvest()",
  "0x1c1b8772": "requestUnstake(uint256)",
  "0x30af6b2e": "claimUnstake(uint256)",
  "0xc7b8981c": "delegate(address)",
  "0x9fa6dd35": "undelegate(address)",
  "0x2f865568": "undelegate(address,uint256)",
  "0x02c3bcbb": "requestWithdrawal(uint256)",
  "0x96e80353": "claimWithdrawal(uint256)",
  "0x26476204": "claimWithdrawals(uint256[])",
  // ── Lido-style ──
  "0xa1903eab": "submit(address)",
  "0x095ea7b3": "approve(address,uint256)",
  "0xa9059cbb": "transfer(address,uint256)",
  // ── Cosmos/IBC bridge-like ──
  "0x0c11dedd": "delegate(address,uint256)",
  "0x8dfc8897": "unbond(address,uint256)",
  "0x4f2be91f": "redelegate(address,address,uint256)",
  // ── HyperEVM precompile candidates (unverified) ──
  // These are placeholder selectors; confirm via ABI
  "0x5c19a95c": "delegate(address)",
  "0xe7a1254f": "stakeTo(address,uint256)",
  "0x8c80d4e5": "unstakeFrom(address,uint256)",
};

// ─────────────────────────────────────────────
// Known event topic0 → event name
// ─────────────────────────────────────────────
// keccak256("EventName(argTypes)")

export const KNOWN_EVENT_TOPICS: Record<string, string> = {
  // Standard staking events
  "0x9e71bc8eea02a63969f509818f2dafb9254532904319f9dbda79b67bd34a5f3d": "Staked(address,uint256)",
  "0x0f5bb82176feb1b5e747e28471aa92156a04d9f3ab9f45f28e2d704232b93f75": "Withdrawn(address,uint256)",
  "0xe1fffcc4923d04b559f4d29a8bfc6cda04eb5b0d3c460751c2402c5c5cc9109c": "Deposit(address,uint256)",
  "0x884edad9ce6fa2440d8a54cc123490eb96d2768479d49ff9c7366125a9424364": "Withdrawal(address,uint256)",
  // ERC4626 events
  "0xdcbc1c05240f31ff3ad067ef1ee35ce4997762752e3a095284754544f4c709d7": "Deposit(address,address,uint256,uint256)",
  "0xfbde797d201c681b91056529119e0b02407c7bb96a4a2c75c01fc9667232c8db": "Withdraw(address,address,address,uint256,uint256)",
  // Unstake request events
  "0x0f5d9f926f98823e49a3ee4427ccca2d2e1b7f3e1b6d83c9d96b8e5c4c3e0f7": "UnstakeRequested(address,uint256,uint256)",
  "0x4d6ce1e535dbade1c23defba91e23b8f791ce5edc0cc320257a2b364e4e38426": "UnstakeClaimed(address,uint256)",
  // Generic reward claim
  "0xe2403640baee7600d7b6f8f45dbc8e3f3a4c9a3e3e5e5f5f5f5f5f5f5f5f5f5": "RewardClaimed(address,uint256)",
  // Transfer (ERC20)
  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef": "Transfer(address,address,uint256)",
};

// ─────────────────────────────────────────────
// Method name → action type mappings
// ─────────────────────────────────────────────

export const METHOD_TO_ACTION: Record<string, string> = {
  stake: "stake",
  deposit: "stake",
  submit: "stake",
  delegate: "stake",
  staketo: "stake",
  restake: "restake",
  redelegate: "redelegate",
  unstake: "unstake_request",
  requestunstake: "unstake_request",
  requestwithdrawal: "unstake_request",
  unbond: "unstake_request",
  undelegate: "unstake_request",
  unstakefrom: "unstake_request",
  withdraw: "unstake_claim",
  claimunstake: "unstake_claim",
  claimwithdrawal: "unstake_claim",
  claimwithdrawals: "unstake_claim",
  redeem: "unstake_claim",
  exit: "unstake_claim",
  claim: "reward_claim",
  getreward: "reward_claim",
  harvest: "reward_claim",
  withdrawrewards: "reward_claim",
};

// ─────────────────────────────────────────────
// Event name → action type mappings
// ─────────────────────────────────────────────

export const EVENT_TO_ACTION: Record<string, string> = {
  "staked(address,uint256)": "stake",
  "deposit(address,uint256)": "stake",
  "deposit(address,address,uint256,uint256)": "stake",
  "withdrawn(address,uint256)": "unstake_claim",
  "withdrawal(address,uint256)": "unstake_claim",
  "withdraw(address,address,address,uint256,uint256)": "unstake_claim",
  "unstakerequested(address,uint256,uint256)": "unstake_request",
  "unstakeclaimed(address,uint256)": "unstake_claim",
  "rewardclaimed(address,uint256)": "reward_claim",
};

// ─────────────────────────────────────────────
// Staking-related keyword heuristics
// ─────────────────────────────────────────────

export const STAKING_KEYWORDS = [
  "stake",
  "staking",
  "unstake",
  "delegate",
  "undelegate",
  "validator",
  "epoch",
  "unbond",
  "withdrawal",
  "reward",
  "harvest",
  "claim",
] as const;
