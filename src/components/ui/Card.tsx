import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * "flat" is the default. "raised" lifts one surface step for content that
   * sits on top of other content (modals, popovers). Depth comes from the
   * surface step and the hairline border — not from shadow stacking.
   */
  tone?: "flat" | "raised";
  /** Adds a hover affordance. Only for cards that are actually clickable. */
  interactive?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

const tones = {
  flat: "bg-surface border-line",
  raised: "bg-raised border-line",
};

const paddings = {
  none: "",
  sm: "p-3",
  md: "p-5",
  lg: "p-6 sm:p-8",
};

export function Card({
  tone = "flat",
  interactive = false,
  padding = "md",
  className = "",
  ...props
}: CardProps) {
  return (
    <div
      className={
        `rounded-xl border ${tones[tone]} ${paddings[padding]} ` +
        (interactive
          ? "transition-colors duration-200 hover:border-accent-line cursor-pointer "
          : "") +
        className
      }
      {...props}
    />
  );
}

export function CardHeader({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`flex items-baseline justify-between gap-3 mb-4 ${className}`} {...props} />;
}

export function CardTitle({ className = "", ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={`text-sm font-semibold text-ink ${className}`} {...props} />;
}

/** Uppercase micro-label above a figure. Kept consistent app-wide. */
export function CardLabel({ className = "", ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={`text-2xs font-semibold uppercase tracking-[0.09em] text-faint ${className}`}
      {...props}
    />
  );
}

/**
 * A figure. Always tabular so digits hold their column between rows and
 * across re-renders — the single most important detail in a financial UI.
 */
export function CardFigure({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`font-data tabular-nums text-2xl font-semibold tracking-tight text-ink ${className}`}
      {...props}
    />
  );
}
