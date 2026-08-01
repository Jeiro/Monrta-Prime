import React from "react";
import { motion, useReducedMotion } from "motion/react";

/**
 * Per-route entry animation.
 *
 * Deliberately asymmetric and short: 220ms in, nothing on the way out.
 *
 * The obvious implementation — `<AnimatePresence mode="wait">` around the
 * router — makes every navigation *slower* than no animation at all,
 * because the incoming page cannot start until the outgoing one has
 * finished leaving. Stacked on top of a lazy chunk fetch, a "premium"
 * transition becomes a third of a second of blank screen. So the old page
 * leaves immediately and the new one arrives under its own motion.
 *
 * The movement is 8px, not 24px. At this duration anything larger reads as
 * the page sliding into position, which draws the eye to the container
 * instead of to the content that just arrived.
 */
export function RouteTransition({
  children,
  routeKey,
}: {
  children: React.ReactNode;
  /** Changes per route — remounts the wrapper so the animation replays. */
  routeKey: string;
}) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) return <>{children}</>;

  return (
    <motion.div
      key={routeKey}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
