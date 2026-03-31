import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import utc from "dayjs/plugin/utc";
import localizedFormat from "dayjs/plugin/localizedFormat";

dayjs.extend(relativeTime);
dayjs.extend(utc);
dayjs.extend(localizedFormat);

/**
 * Format ISO string to local datetime for display.
 * e.g. "2024-01-15T12:34:56.000Z" → "Jan 15, 2024 12:34:56"
 */
export function formatTimestamp(iso: string | null | undefined): string {
  if (!iso) return "—";
  return dayjs(iso).format("MMM D, YYYY HH:mm:ss");
}

/**
 * Relative time from now.
 * e.g. "3 days ago"
 */
export function fromNow(iso: string | null | undefined): string {
  if (!iso) return "—";
  return dayjs(iso).fromNow();
}

/**
 * ISO string → ms epoch
 */
export function toMs(iso: string): number {
  return dayjs(iso).valueOf();
}

/**
 * ms epoch → ISO string
 */
export function msToIso(ms: number): string {
  return dayjs(ms).toISOString();
}

/**
 * Estimate claimable time given request timestamp and delay in ms.
 */
export function estimateClaimableTime(
  requestIso: string,
  delayMs: number
): string {
  const claimableMs = dayjs(requestIso).valueOf() + delayMs;
  return dayjs(claimableMs).toISOString();
}

/**
 * Returns true if estimated unlock time has passed.
 */
export function isClaimable(requestIso: string, delayMs: number): boolean {
  const now = Date.now();
  const claimableMs = dayjs(requestIso).valueOf() + delayMs;
  return now >= claimableMs;
}

/**
 * Format duration in ms to human-readable string.
 * e.g. 604800000 → "7 days"
 */
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

/**
 * Short date for table cells.
 */
export function shortDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return dayjs(iso).format("MM/DD/YY HH:mm");
}
