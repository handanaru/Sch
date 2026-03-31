/**
 * General formatting utilities.
 */

/**
 * Capitalize first letter.
 */
export function capitalize(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Convert snake_case to readable label.
 * e.g. "unstake_request" → "Unstake Request"
 */
export function actionTypeLabel(actionType: string): string {
  return actionType
    .split("_")
    .map((w) => capitalize(w))
    .join(" ");
}

/**
 * Truncate long string with ellipsis.
 */
export function truncate(str: string, maxLen: number): string {
  if (!str || str.length <= maxLen) return str;
  return str.slice(0, maxLen) + "…";
}

/**
 * Format a confidence level to a display string.
 */
export function confidenceLabel(confidence: string): string {
  const map: Record<string, string> = {
    high: "High",
    medium: "Medium",
    low: "Low",
  };
  return map[confidence] ?? confidence;
}

/**
 * Returns true if value is non-null, non-undefined, non-empty string.
 */
export function isPresent<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined && value !== "";
}
