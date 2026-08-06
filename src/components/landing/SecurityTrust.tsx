import React from "react";
import { motion } from "motion/react";
import { Check, FileCheck, Lock, ShieldCheck } from "lucide-react";
import { Section, Container } from "../ui/Layout";
import { useReveal } from "./useReveal";

/**
 * Security and compliance strip.
 *
 * The three named partners were confirmed by the client as real
 * engagements. They are third-party attestations, so each badge should
 * link to the published report as soon as one exists — a named audit firm
 * with nothing to click is the weakest form of this claim, and the most
 * damaging one to get wrong. `href` is the hook for that; fill it in.
 */

const BADGES = [
  { icon: ShieldCheck, name: "CertiK", detail: "Smart-contract audit", href: undefined as string | undefined },
  { icon: FileCheck, name: "OpenZeppelin", detail: "Protocol review", href: undefined as string | undefined },
  { icon: Lock, name: "SOC 2", detail: "Type II controls", href: undefined as string | undefined },
  { icon: Check, name: "Multi-sig custody", detail: "Live in the platform", href: undefined as string | undefined },
];

export const SecurityTrust: React.FC = () => {
  const reveal = useReveal();
  return (
  <Section divided className="bg-panel" id="security">
    <Container>
      <div className="text-center">
        <p className="text-2xs font-semibold uppercase tracking-[0.14em] text-accent">
          Security &amp; compliance
        </p>
        <h2 className="mx-auto mt-3 max-w-[20ch] font-display text-[clamp(1.9rem,3.6vw,2.75rem)] font-normal leading-tight tracking-tight text-ink text-balance">
          Verifiable, not just stated
        </h2>
        <p className="mx-auto mt-3 max-w-[56ch] text-sm leading-relaxed text-muted">
          Independent review and custody controls, with the reports behind them available on
          request.
        </p>
      </div>

      <motion.ul
        {...reveal}
        className="mt-8 flex flex-wrap justify-center gap-3"
      >
        {BADGES.map(({ icon: Ico, name, detail, href }) => {
          const body = (
            <>
              <Ico
                size={17}
                aria-hidden="true"
                className={name === "Multi-sig custody" ? "text-positive" : "text-accent"}
              />
              <span>
                <span className="block text-sm font-semibold text-ink">{name}</span>
                <span className="block text-2xs text-faint">{detail}</span>
              </span>
            </>
          );
          const shell =
            "flex items-center gap-2.5 rounded-xl border border-line bg-surface px-5 py-3.5 transition-[transform,border-color] duration-200";

          return (
            <li key={name}>
              {href ? (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${shell} hover:scale-[1.02] hover:border-line-strong`}
                >
                  {body}
                </a>
              ) : (
                <div className={shell}>{body}</div>
              )}
            </li>
          );
        })}
      </motion.ul>
    </Container>
  </Section>
);
};
