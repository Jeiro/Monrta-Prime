import React from "react";
import { motion } from "motion/react";
import { useReveal } from "./useReveal";

/**
 * Trust metrics strip.
 *
 * The three figures here were confirmed as real by the client. If any of
 * them stops being true, change it — do not leave a stale number sitting
 * on the landing page, and do not add a new one that nobody can source.
 * The uptime figure in particular should track whatever the monitoring
 * actually reports rather than being a fixed string forever.
 */

const STATS = [
  { value: "$1.4B+", label: "Total asset value" },
  { value: "0.0001%", label: "Avg transaction fee" },
  { value: "99.99%", label: "Platform uptime" },
  { value: "Multi-sig", label: "Custody model" },
];

export const StatsBar: React.FC = () => {
  const reveal = useReveal();
  return (
  <section className="border-y border-line bg-panel">
    <motion.dl
      {...reveal}
      className="mx-auto grid max-w-7xl grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
    >
      {STATS.map(({ value, label }, i) => (
        <div
          key={label}
          className={
            "px-6 py-8 " +
            // Dividers between cells, not around the block — borders are
            // drawn per breakpoint so no cell gets a stray leading rule.
            (i > 0 ? "border-t border-line sm:border-t-0 sm:border-l " : "") +
            (i === 2 ? "sm:border-t sm:border-l-0 lg:border-t-0 lg:border-l " : "") +
            (i === 3 ? "sm:border-t lg:border-t-0 " : "")
          }
        >
          <dd className="font-data text-3xl font-semibold tabular-nums tracking-tight text-ink">
            {value}
          </dd>
          <dt className="mt-1.5 text-2xs font-semibold uppercase tracking-[0.09em] text-faint">
            {label}
          </dt>
        </div>
      ))}
    </motion.dl>
  </section>
);
};
