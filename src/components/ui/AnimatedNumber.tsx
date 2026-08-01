import { useEffect, useRef, useState } from "react";
import { useMotionValue, useSpring, useReducedMotion } from "motion/react";

/**
 * A figure that animates to its value.
 *
 * The important restraint: this does NOT animate on every change. A live
 * balance that re-renders on each websocket tick would be permanently
 * mid-count and therefore permanently unreadable — the worst possible
 * property for a number someone is trying to act on.
 *
 * So it counts on first paint (where it reads as the figure landing), and
 * on changes above `threshold` (a deposit, a settled trade). Small ticks
 * snap. `threshold` is a ratio of the current value, not an absolute, so
 * it behaves the same on a $50 account and a $500,000 one.
 *
 * Digits are tabular and the width is stable, so a counting figure never
 * reflows the row it sits in.
 */

export interface AnimatedNumberProps {
  value: number;
  /** Fractional digits. 2 for currency, 0 for counts. */
  decimals?: number;
  prefix?: string;
  suffix?: string;
  /** Relative change required to animate rather than snap. Default 2%. */
  threshold?: number;
  /** Thousands separators. Off for things like basis points. */
  grouped?: boolean;
  className?: string;
}

export function AnimatedNumber({
  value,
  decimals = 2,
  prefix = "",
  suffix = "",
  threshold = 0.02,
  grouped = true,
  className = "",
}: AnimatedNumberProps) {
  const reduceMotion = useReducedMotion();
  const motionValue = useMotionValue(0);
  // Stiffness/damping tuned to settle in ~700ms without overshoot. A number
  // that bounces past its value and comes back is legible as "wrong" for a
  // few frames, which is unacceptable for money.
  const spring = useSpring(motionValue, { stiffness: 90, damping: 22, mass: 0.6 });
  const [display, setDisplay] = useState(value);
  const previous = useRef<number | null>(null);

  useEffect(() => {
    const prev = previous.current;
    previous.current = value;

    const isFirstPaint = prev === null;
    const delta = isFirstPaint ? Infinity : Math.abs(value - prev);
    const relative = prev ? delta / Math.abs(prev) : Infinity;

    if (reduceMotion || (!isFirstPaint && relative < threshold)) {
      motionValue.jump(value);
      spring.jump(value);
      setDisplay(value);
      return;
    }

    // Count up from zero on first paint, from the old value afterwards.
    if (isFirstPaint) {
      motionValue.jump(0);
      spring.jump(0);
    }
    motionValue.set(value);
  }, [value, reduceMotion, threshold, motionValue, spring]);

  useEffect(() => spring.on("change", (v) => setDisplay(v)), [spring]);

  const formatted = display.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping: grouped,
  });

  return (
    <span className={`font-data tabular-nums ${className}`}>
      {/* The live value is announced only once it settles — a screen reader
          reading every intermediate frame is noise, not information. */}
      <span aria-hidden="true">
        {prefix}
        {formatted}
        {suffix}
      </span>
      <span className="sr-only">
        {prefix}
        {value.toLocaleString(undefined, {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })}
        {suffix}
      </span>
    </span>
  );
}
