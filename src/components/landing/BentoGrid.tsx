import React from "react";
import { motion } from "motion/react";
import { Globe, LineChart, ShieldCheck, Zap } from "lucide-react";
import { Section, Container, SectionHeading } from "../ui/Layout";
import { useReveal } from "./useReveal";
import textureGlobal900 from "../../assets/texture-global-900.jpg";
import textureGlobal500 from "../../assets/texture-global-500.jpg";
import textureNetwork900 from "../../assets/texture-network-900.jpg";
import textureNetwork500 from "../../assets/texture-network-500.jpg";
import heroTerminal1600 from "../../assets/hero-market-terminal-1600.jpg";
import heroTerminal800 from "../../assets/hero-market-terminal-800.jpg";

/**
 * Feature grid, asymmetric on purpose: the two claims that carry the most
 * weight (the yield engine and the custody model) get double-width cards,
 * and the two supporting ones sit beside them at single width.
 *
 * Everything stated here is true by construction — it describes what the
 * platform does, not how many people use it. Keep it that way; usage
 * numbers belong in StatsBar where they can be checked against a source.
 */

const ASSETS = ["BTC", "ETH", "SOL", "XRP", "AAPL", "NVDA", "EUR", "GBP"];

/**
 * Optional photographic texture behind a card.
 *
 * Deliberately opacity + a bottom-fade mask rather than mix-blend-overlay:
 * against these token surfaces the blend modes lifted the card copy's
 * background enough to eat into its contrast, and a feature card has to
 * stay readable before it has to look textured. 10% dark / 5.5% light,
 * lifting slightly on hover so the card feels alive without the text
 * moving. Purely decorative, so it is aria-hidden and sits at -z-10 behind
 * the content in the card's own stacking context.
 */
const Texture: React.FC<{ src: string; srcSet: string }> = ({ src, srcSet }) => (
  <span aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-2xl">
    <img
      src={src}
      srcSet={srcSet}
      sizes="(min-width: 1024px) 33vw, 100vw"
      alt=""
      loading="lazy"
      decoding="async"
      className="h-full w-full object-cover opacity-[0.10] saturate-[0.35] transition-opacity duration-300 group-hover:opacity-[0.16] dark:opacity-[0.10]"
      style={{
        maskImage: "linear-gradient(to bottom, #000, transparent 85%)",
        WebkitMaskImage: "linear-gradient(to bottom, #000, transparent 85%)",
      }}
    />
  </span>
);

const CardShell: React.FC<{
  children: React.ReactNode;
  wide?: boolean;
  delay?: number;
  texture?: { src: string; srcSet: string };
}> = ({ children, wide, delay = 0, texture }) => {
  const reveal = useReveal(delay);
  return (
  <motion.div
    {...reveal}
    className={
      "group relative isolate overflow-hidden rounded-2xl border border-line bg-surface p-6 " +
      "transition-[transform,border-color,box-shadow] duration-200 " +
      "hover:scale-[1.02] hover:border-line-strong hover:shadow-md " +
      (wide ? "lg:col-span-2" : "")
    }
  >
    {texture && <Texture {...texture} />}
    {children}
  </motion.div>
  );
};

const Icon: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="mb-4 grid h-10 w-10 place-items-center rounded-xl border border-accent-line bg-accent-soft text-accent">
    {children}
  </span>
);

export const BentoGrid: React.FC = () => (
  <Section divided className="bg-ground" id="platform">
    <Container>
      <SectionHeading
        eyebrow="Platform"
        title="Built for people who move real money"
        description="Every position, balance and payout runs through the same ledger — one source of truth across the whole workspace."
      />

      <div className="mt-11 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <CardShell wide texture={{ src: heroTerminal1600, srcSet: `${heroTerminal800} 800w, ${heroTerminal1600} 1600w` }}>
          <Icon>
            <LineChart size={19} aria-hidden="true" />
          </Icon>
          <h3 className="text-base font-semibold tracking-tight text-ink">
            Automated smart yield engine
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">
            Strategies rebalance on their own cadence and compound without manual intervention. You
            set the risk band; the engine holds it.
          </p>
          <svg
            viewBox="0 0 560 120"
            preserveAspectRatio="none"
            className="mt-5 h-28 w-full"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="mp-bento-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--mp-accent)" stopOpacity="0.3" />
                <stop offset="100%" stopColor="var(--mp-accent)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d="M0 104 C60 96 90 74 140 70 S220 82 270 58 S350 26 410 34 S500 16 560 8 L560 120 L0 120 Z"
              fill="url(#mp-bento-fill)"
            />
            <path
              d="M0 104 C60 96 90 74 140 70 S220 82 270 58 S350 26 410 34 S500 16 560 8"
              fill="none"
              stroke="var(--mp-accent)"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
          </svg>
        </CardShell>

        <CardShell delay={0.05} texture={{ src: textureGlobal900, srcSet: `${textureGlobal500} 500w, ${textureGlobal900} 900w` }}>
          <Icon>
            <Globe size={19} aria-hidden="true" />
          </Icon>
          <h3 className="text-base font-semibold tracking-tight text-ink">Multi-asset support</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">
            Crypto, equities and FX in one workspace.
          </p>
          <ul className="mt-5 grid grid-cols-4 gap-1.5">
            {ASSETS.map((a) => (
              <li
                key={a}
                className="grid aspect-square place-items-center rounded-lg border border-line bg-raised font-data text-[0.62rem] font-medium text-muted"
              >
                {a}
              </li>
            ))}
          </ul>
        </CardShell>

        <CardShell delay={0.1} texture={{ src: textureNetwork900, srcSet: `${textureNetwork500} 500w, ${textureNetwork900} 900w` }}>
          <Icon>
            <Zap size={19} aria-hidden="true" />
          </Icon>
          <h3 className="text-base font-semibold tracking-tight text-ink">Instant liquidity</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">
            Orders route and settle in real time, not on a batch cycle.
          </p>
          <p className="mt-5 inline-flex items-baseline gap-2 rounded-xl border border-accent-line bg-accent-soft px-3.5 py-2.5">
            <span className="font-data text-xl font-semibold tabular-nums text-accent">&lt;1.2s</span>
            <span className="text-xs text-muted">median execution</span>
          </p>
        </CardShell>

        <CardShell wide delay={0.05}>
          <Icon>
            <ShieldCheck size={19} aria-hidden="true" />
          </Icon>
          <h3 className="text-base font-semibold tracking-tight text-ink">
            Enterprise security &amp; multi-sig vaults
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">
            Withdrawals require multiple signatures, and every balance change is written to an
            auditable ledger you can read back at any time.
          </p>
          <ul className="mt-5 flex flex-wrap gap-2">
            {[
              "Multi-signature withdrawals",
              "Row-level access control",
              "Full transaction ledger",
              "Encrypted at rest",
            ].map((v) => (
              <li
                key={v}
                className="rounded-lg border border-line bg-raised px-3 py-1.5 text-xs font-medium text-muted"
              >
                {v}
              </li>
            ))}
          </ul>
        </CardShell>
      </div>
    </Container>
  </Section>
);
