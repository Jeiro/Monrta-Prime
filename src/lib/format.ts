/**
 * Date/time formatting for display.
 *
 * Supabase returns timestamptz as ISO strings ("2026-07-31T14:35:24.04444+00:00")
 * and sixteen render sites were printing them verbatim — announcements, the
 * transaction ledger, investment maturity dates, admin queues. Users should
 * never see a raw timestamp.
 *
 * Inputs are tolerated rather than trusted: some columns are text dates
 * ("2026-07-16"), some are full timestamps, and mock data can be neither. An
 * unparseable value is returned unchanged rather than shown as "Invalid Date".
 */

const parse = (value: string | number | Date | null | undefined): Date | null => {
  if (value === null || value === undefined || value === "") return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

/** "31 Jul 2026" */
export function formatDate(value: string | number | Date | null | undefined): string {
  const d = parse(value);
  if (!d) return typeof value === "string" ? value : "—";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

/** "31 Jul 2026, 14:35" */
export function formatDateTime(value: string | number | Date | null | undefined): string {
  const d = parse(value);
  if (!d) return typeof value === "string" ? value : "—";
  return `${d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}, ${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
}

/** "in 5 days" / "3 days ago" / "today" — for maturity and recency. */
export function formatRelative(value: string | number | Date | null | undefined): string {
  const d = parse(value);
  if (!d) return typeof value === "string" ? value : "—";
  const days = Math.round((d.getTime() - Date.now()) / 86_400_000);
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  if (days === -1) return "yesterday";
  return days > 0 ? `in ${days} days` : `${Math.abs(days)} days ago`;
}
