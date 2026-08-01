import React from "react";

/**
 * Loading placeholder.
 *
 * The rule this enforces: a skeleton must occupy the same box the real
 * content will. Anything else is a layout shift dressed up as a loading
 * state, and on a balance screen it means the number lands under the
 * user's cursor a beat after they've started moving toward something else.
 *
 * Uses a sweeping highlight rather than `animate-pulse`. Pulsing opacity
 * makes a grid of skeletons strobe in unison, which reads as a fault;
 * a sweep reads as progress.
 */

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Tailwind width class, e.g. "w-24" or "w-full". */
  width?: string;
  /** Tailwind height class. Defaults to one line of body text. */
  height?: string;
  shape?: "line" | "block" | "circle";
}

const shapes = {
  line: "rounded-sm",
  block: "rounded-lg",
  circle: "rounded-full",
};

export function Skeleton({
  width = "w-full",
  height = "h-4",
  shape = "line",
  className = "",
  ...props
}: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={
        `relative overflow-hidden bg-raised ${shapes[shape]} ${width} ${height} ` +
        `before:absolute before:inset-0 before:-translate-x-full before:animate-[skeleton-sweep_1.6s_ease-in-out_infinite] ` +
        `before:bg-gradient-to-r before:from-transparent before:via-line-strong/50 before:to-transparent ` +
        className
      }
      {...props}
    />
  );
}

/**
 * Skeleton for a figure tile. Mirrors StatCard's box exactly — same border,
 * same padding, same two-line stack — so the swap to real content moves
 * nothing.
 */
export function SkeletonStat({ className = "" }: { className?: string }) {
  return (
    <div className={`rounded-xl border border-line bg-surface p-4 ${className}`}>
      <Skeleton width="w-20" height="h-2.5" />
      <Skeleton width="w-32" height="h-7" className="mt-3" />
      <Skeleton width="w-24" height="h-3" className="mt-2" />
    </div>
  );
}

/** Skeleton rows for a DataTable body. `cols` should match the real header. */
export function SkeletonRows({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} className="border-b border-line/60">
          {Array.from({ length: cols }).map((_, c) => (
            <td key={c} className="px-4 py-3.5">
              {/* Varied widths — a column of identical bars looks like a
                  loading bug rather than like text. */}
              <Skeleton width={c === 0 ? "w-28" : c % 2 ? "w-16" : "w-20"} height="h-3.5" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
