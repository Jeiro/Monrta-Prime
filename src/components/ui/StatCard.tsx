import React from "react";
import type { LucideIcon } from "lucide-react";

/**
 * A figure tile for dashboard and admin headers.
 *
 * The four balance cards on Dashboard Overview were ~25 lines of duplicated
 * markup each, and each gave its icon a different hue (blue, emerald, rose,
 * accent) — four accents in a system that allows one. The icon is neutral
 * here; emphasis comes from the figure, and colour only ever encodes an
 * outcome via `delta`.
 *
 * Figures are tabular so a column of tiles keeps its digits aligned and
 * doesn't jitter when values tick.
 */

export interface StatCardProps {
  label: string;
  value: React.ReactNode;
  icon?: LucideIcon;
  /** Quiet secondary line under the figure (e.g. "≈ 0.2694 BTC"). */
  hint?: React.ReactNode;
  /** Signed change. Colour is derived from the sign — never passed in. */
  delta?: { value: number; percent?: number | string; label?: string };
  /** Marks the single most important tile on the screen. Use at most once. */
  emphasis?: boolean;
  className?: string;
}

const fmtSigned = (n: number) =>
  `${n >= 0 ? "+" : "−"}${Math.abs(n).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  delta,
  emphasis = false,
  className = "",
}: StatCardProps) {
  const up = delta ? delta.value >= 0 : false;

  return (
    <div
      className={
        `rounded-xl border bg-surface p-4 ` +
        (emphasis ? "border-accent-line" : "border-line") +
        ` ${className}`
      }
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-2xs font-semibold uppercase tracking-[0.09em] text-faint">
          {label}
        </span>
        {Icon && <Icon size={15} className={emphasis ? "text-accent" : "text-faint"} />}
      </div>

      <div
        className={
          `mt-3 font-data tabular-nums font-semibold tracking-tight text-ink ` +
          (emphasis ? "text-2xl" : "text-xl")
        }
      >
        {value}
      </div>

      {(hint || delta) && (
        <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          {delta && (
            <span
              className={`font-data tabular-nums text-xs font-semibold ${
                up ? "text-positive" : "text-negative"
              }`}
            >
              {fmtSigned(delta.value)}
              {delta.percent !== undefined && ` (${delta.percent}%)`}
            </span>
          )}
          {delta?.label && <span className="text-2xs text-faint">{delta.label}</span>}
          {hint && <span className="text-2xs text-faint">{hint}</span>}
        </div>
      )}
    </div>
  );
}
