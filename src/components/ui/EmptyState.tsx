import React from "react";
import type { LucideIcon } from "lucide-react";

/**
 * Empty state.
 *
 * An empty table is a dead end unless it says what would fill it and how to
 * start. Every empty state here takes an action where one genuinely exists —
 * "No transactions yet" is a fact; "No transactions yet · Make a deposit" is
 * a route forward.
 *
 * The icon is deliberately quiet (faint, hairline ring). A large coloured
 * illustration in an empty state competes with the action beneath it.
 */

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: React.ReactNode;
  /** Primary route forward. Omit only when there genuinely isn't one. */
  action?: React.ReactNode;
  /** Compact variant for inside a table or a narrow card. */
  size?: "sm" | "md";
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  size = "md",
  className = "",
}: EmptyStateProps) {
  const compact = size === "sm";

  return (
    <div
      className={
        `flex flex-col items-center justify-center text-center ` +
        (compact ? "gap-2 px-4 py-10 " : "gap-3 px-6 py-16 ") +
        className
      }
    >
      {Icon && (
        <div
          className={
            `grid place-items-center rounded-full border border-line bg-raised text-faint ` +
            (compact ? "h-9 w-9" : "h-12 w-12")
          }
        >
          <Icon size={compact ? 16 : 20} aria-hidden="true" />
        </div>
      )}

      <p className={`font-semibold text-ink ${compact ? "text-sm" : "text-base"}`}>{title}</p>

      {description && (
        <p className={`max-w-sm leading-relaxed text-muted ${compact ? "text-xs" : "text-sm"}`}>
          {description}
        </p>
      )}

      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
