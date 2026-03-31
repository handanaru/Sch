/**
 * Utilities for transaction hash / address formatting.
 */

/**
 * Shorten a tx hash or address for display.
 * e.g. "0x1234...5678"
 */
export function shortHash(hash: string, prefixLen = 6, suffixLen = 4): string {
  if (!hash) return "—";
  if (hash.length <= prefixLen + suffixLen) return hash;
  return `${hash.slice(0, prefixLen)}...${hash.slice(-suffixLen)}`;
}

/**
 * Extract method ID (first 4 bytes) from raw input hex.
 * Returns null if input is empty or "0x".
 */
export function extractMethodId(rawInput: string): string | null {
  if (!rawInput || rawInput === "0x" || rawInput.length < 10) return null;
  return rawInput.slice(0, 10).toLowerCase();
}

/**
 * Returns true if the raw input is empty (ETH transfer / no calldata).
 */
export function isEmptyCalldata(rawInput: string): boolean {
  return !rawInput || rawInput === "0x" || rawInput === "0x0";
}

/**
 * Normalize an address to lowercase.
 */
export function normalizeAddress(addr: string | null | undefined): string {
  if (!addr) return "";
  return addr.toLowerCase();
}

/**
 * Returns true if two addresses are the same (case-insensitive).
 */
export function isSameAddress(a: string, b: string): boolean {
  return normalizeAddress(a) === normalizeAddress(b);
}

/**
 * Build a block explorer tx URL.
 */
export function explorerTxUrl(baseUrl: string, hash: string): string {
  return `${baseUrl}/tx/${hash}`;
}

/**
 * Build a block explorer address URL.
 */
export function explorerAddressUrl(baseUrl: string, address: string): string {
  return `${baseUrl}/address/${address}`;
}

/**
 * Copy text to clipboard.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
