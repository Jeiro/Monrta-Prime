import { useReducedMotion } from "motion/react";

/**
 * Scroll-reveal props shared by the landing sections.
 *
 * Centralised so every section fades in on the same curve, and — the part
 * that matters — so the reduced-motion check happens once. Under that
 * preference the offset is dropped entirely and the element simply renders,
 * rather than sliding up. Matches how Hero and the rest of the app
 * (RouteTransition, Progress, AnimatedNumber) treat the same preference.
 */
export function useReveal(delay = 0) {
  const reduceMotion = useReducedMotion();
  return reduceMotion
    ? { initial: false as const }
    : {
        initial: { opacity: 0, y: 16 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, margin: "-60px" },
        transition: { duration: 0.45, delay, ease: "easeOut" as const },
      };
}
