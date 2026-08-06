import React from "react";
import { motion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { Button } from "../ui";
import { Container } from "../ui/Layout";
import { useReveal } from "./useReveal";

/**
 * Closing conversion banner. Deliberately the only place below the hero
 * that repeats the primary CTA — a landing page that restates its ask in
 * every section reads as pressure rather than confidence.
 */
export const FinalCta: React.FC<{ onNavigate: (view: string) => void; isLoggedIn: boolean }> = ({
  onNavigate,
  isLoggedIn,
}) => {
  const reveal = useReveal();
  return (
  <section className="px-4 pb-20 pt-4">
    <Container>
      <motion.div
        {...reveal}
        className="rounded-3xl border border-accent-line bg-gradient-to-br from-accent-soft to-surface px-6 py-16 text-center sm:px-10"
      >
        <h2 className="mx-auto max-w-[22ch] font-display text-[clamp(1.9rem,3.6vw,2.75rem)] font-normal leading-tight tracking-tight text-ink text-balance">
          Ready to elevate your portfolio?
        </h2>
        <p className="mx-auto mt-3 max-w-[52ch] text-sm leading-relaxed text-muted">
          Open an account in a few minutes. No paperwork, no waiting on a callback.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Button
            size="lg"
            iconRight={ArrowUpRight}
            onClick={() => onNavigate(isLoggedIn ? "dashboard" : "auth")}
          >
            Start building wealth
          </Button>
          <Button size="lg" variant="secondary" onClick={() => onNavigate("contact")}>
            Talk to our team
          </Button>
        </div>
      </motion.div>
    </Container>
  </section>
);
};
