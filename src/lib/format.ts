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

/**
 * Money.
 *
 * `$${n.toLocaleString(undefined, { minimumFractionDigits: 2 })}` appeared
 * ~20 times on the dashboard alone, and not always with the same options —
 * some sites passed `maximumFractionDigits`, some didn't, so the same figure
 * could render as "1,204.5" in one card and "1,204.50" in the next. Both
 * bounds are pinned here so a column of figures always has the same number
 * of decimals.
 */
export function formatMoney(
  value: number,
  options: { decimals?: number; sign?: boolean } = {}
): string {
  const { decimals = 2, sign = false } = options;
  const body = Math.abs(value).toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  // U+2212 minus, not a hyphen: it matches the digit width in a tabular
  // font, so signed figures stay aligned down a column.
  const prefix = value < 0 ? "−" : sign ? "+" : "";
  return `${prefix}$${body}`;
}

/** "$1.2M" / "$62k" — axis ticks and dense tiles, never a primary figure. */
export function formatCompactMoney(value: number): string {
  return `$${Intl.NumberFormat(undefined, {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value)}`;
}

/**
 * Stable numeric UID derived from the user's email (7 digits, zero-padded).
 * Was defined independently in Navigation and DashboardOverview — one shared
 * implementation so the two can never drift and show different UIDs.
 */
export function getUID(email: string | null): string {
  if (!email) return "0000000";
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = (hash << 5) - hash + email.charCodeAt(i);
    hash |= 0;
  }
  return String(Math.abs(hash) % 10_000_000).padStart(7, "0");
}
