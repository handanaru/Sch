import { DASHBOARD_CONFIG } from "@/config/dashboard";

const { nativeDecimals, nativeSymbol } = DASHBOARD_CONFIG;

/**
 * Convert wei (BigInt string) to human-readable amount.
 * Uses native token decimals by default.
 */
export function weiToFormatted(
  weiStr: string,
  decimals: number = nativeDecimals,
  symbol: string = nativeSymbol
): string {
  if (!weiStr || weiStr === "0") return `0 ${symbol}`;
  try {
    const raw = BigInt(weiStr);
    const divisor = BigInt(10 ** decimals);
    const whole = raw / divisor;
    const fraction = raw % divisor;

    if (fraction === 0n) {
      return `${whole.toString()} ${symbol}`;
    }

    const fractionStr = fraction.toString().padStart(decimals, "0");
    // up to 6 significant fraction digits
    const trimmed = fractionStr.replace(/0+$/, "").slice(0, 6);
    return `${whole}.${trimmed} ${symbol}`;
  } catch {
    return `${weiStr} ${symbol}`;
  }
}

/**
 * Parse a human-readable amount string back to wei BigInt.
 * e.g. "1.5 HYPE" → 1500000000000000000n
 */
export function formattedToWei(
  formatted: string,
  decimals: number = nativeDecimals
): bigint {
  const num = formatted.replace(/[^0-9.]/g, "");
  if (!num) return 0n;
  try {
    const [whole, frac = ""] = num.split(".");
    const paddedFrac = frac.slice(0, decimals).padEnd(decimals, "0");
    return BigInt(whole + paddedFrac);
  } catch {
    return 0n;
  }
}

/**
 * Add multiple wei strings safely.
 */
export function addWei(...amounts: string[]): string {
  return amounts.reduce((acc, a) => {
    try {
      return (BigInt(acc || "0") + BigInt(a || "0")).toString();
    } catch {
      return acc;
    }
  }, "0");
}

/**
 * Subtract b from a in wei strings. Returns "0" if result < 0.
 */
export function subWei(a: string, b: string): string {
  try {
    const result = BigInt(a || "0") - BigInt(b || "0");
    return result < 0n ? "0" : result.toString();
  } catch {
    return "0";
  }
}

/**
 * Format a big number with commas for display (without symbol).
 * e.g. 1234567 → "1,234,567"
 */
export function formatNumber(n: number | string): string {
  const num = typeof n === "string" ? parseFloat(n) : n;
  if (isNaN(num)) return "0";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 6 }).format(num);
}

/**
 * Extract the numeric part only from a formatted amount string.
 * e.g. "1.5 HYPE" → 1.5
 */
export function parseFormattedAmount(formatted: string): number {
  const num = formatted.replace(/[^0-9.]/g, "");
  return parseFloat(num) || 0;
}
