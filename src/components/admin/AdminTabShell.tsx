import React from "react";
import { motion } from "motion/react";
import type { LucideIcon } from "lucide-react";

/**
 * Shared chrome for an admin tab.
 *
 * Every tab had rebuilt this by hand — a title block, a row of count tiles,
 * a transient feedback banner and a filter bar — each with slightly
 * different padding and radius. The queues (deposits, withdrawals, KYC) are
 * near-identical screens, so they should not drift apart.
 */

export interface AdminStat {
  label: string;
  value: number;
  tone?: "neutral" | "warning" | "positive" | "negative";
}

const toneClass: Record<NonNullable<AdminStat["tone"]>, string> = {
  neutral: "border-line bg-panel text-ink",
  warning: "border-warning-line bg-warning-soft text-warning",
  positive: "border-positive-line bg-positive-soft text-positive",
  negative: "border-negative-line bg-negative-soft text-negative",
};

export function AdminTabHeader({
  title,
  description,
  icon: Icon,
  stats,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  stats?: AdminStat[];
}) {
  return (
    <div className="flex flex-col items-start justify-between gap-4 rounded-xl border border-line bg-surface p-5 xl:flex-row xl:items-center">
      <div>
        <h1 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-ink">
          {Icon && <Icon size={18} className="shrink-0 text-faint" aria-hidden="true" />}
          {title}
        </h1>
        {description && <p className="mt-1 text-xs text-muted">{description}</p>}
      </div>

      {stats && stats.length > 0 && (
        <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className={`min-w-[78px] rounded-lg border px-3 py-2 ${toneClass[stat.tone ?? "neutral"]}`}
            >
              <dt className="text-2xs font-semibold uppercase tracking-[0.09em] opacity-70">
                {stat.label}
              </dt>
              <dd className="font-data text-sm font-semibold tabular-nums">{stat.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}

/** Wrapper that gives every tab the same mount transition. */
export function AdminTabShell({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-5"
    >
      {children}
    </motion.div>
  );
}
