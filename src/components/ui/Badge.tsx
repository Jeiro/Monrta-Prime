import React from "react";

/**
 * Status pill.
 *
 * "positive"/"negative"/"warning" are semantic — they describe an outcome
 * (approved, rejected, pending). "accent" is for emphasis that is NOT an
 * outcome. Keep the two apart: an accent-coloured badge on a rejected
 * withdrawal reads as approval.
 */
type Tone = "neutral" | "accent" | "positive" | "negative" | "warning";

const tones: Record<Tone, string> = {
  neutral: "bg-raised text-muted border-line",
  accent: "bg-accent-soft text-accent border-accent-line",
  positive: "bg-positive/10 text-positive border-positive/25",
  negative: "bg-negative/10 text-negative border-negative/25",
  warning: "bg-amber-400/10 text-amber-300 border-amber-400/25",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

export function Badge({ tone = "neutral", className = "", ...props }: BadgeProps) {
  return (
    <span
      className={
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 " +
        "text-[11px] font-semibold uppercase tracking-[0.04em] whitespace-nowrap " +
        `${tones[tone]} ${className}`
      }
      {...props}
    />
  );
}
