import { motion, useReducedMotion } from "motion/react";

/**
 * Progress bar.
 *
 * Hand-rolled three times on the dashboard alone (investments, copy trades,
 * and again per-card), each with slightly different heights and track
 * colours. This is the one implementation.
 *
 * It is a `role="progressbar"` with real ARIA values — the previous divs
 * were invisible to assistive tech, so "68% complete" existed only as a
 * visual. The fill animates from its previous width rather than snapping,
 * because a bar that jumps reads as a re-render, not as progress.
 */

export interface ProgressProps {
  /** 0–100. Clamped, so a bad server value can't overflow the track. */
  value: number;
  /** Describes what is progressing, for screen readers. */
  label: string;
  size?: "sm" | "md";
  /** Semantic override. Defaults to the accent (neutral progress). */
  tone?: "accent" | "positive" | "warning";
  className?: string;
}

const tones = {
  accent: "bg-accent",
  positive: "bg-positive",
  warning: "bg-warning",
};

export function Progress({
  value,
  label,
  size = "sm",
  tone = "accent",
  className = "",
}: ProgressProps) {
  const reduceMotion = useReducedMotion();
  const clamped = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
  const height = size === "sm" ? "h-1.5" : "h-2";

  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={`w-full overflow-hidden rounded-full bg-raised ${height} ${className}`}
    >
      <motion.div
        className={`h-full rounded-full ${tones[tone]}`}
        initial={reduceMotion ? false : { width: 0 }}
        animate={{ width: `${clamped}%` }}
        transition={{ duration: reduceMotion ? 0 : 0.6, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  );
}
