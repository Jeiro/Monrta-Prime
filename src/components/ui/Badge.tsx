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
  positive: "bg-positive-soft text-positive border-positive-line",
  negative: "bg-negative-soft text-negative border-negative-line",
  warning: "bg-warning-soft text-warning border-warning-line",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

export function Badge({ tone = "neutral", className = "", ...props }: BadgeProps) {
  return (
    <span
      className={
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 " +
        "text-2xs font-semibold uppercase tracking-[0.04em] whitespace-nowrap " +
        `${tones[tone]} ${className}`
      }
      {...props}
    />
  );
}
