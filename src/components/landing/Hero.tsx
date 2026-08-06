import React from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowUpRight, Play, Sparkles, TrendingUp } from "lucide-react";
import { Button } from "../ui";

/**
 * Landing hero.
 *
 * Replaces the orbiting-brandmark composition. That one was decorative —
 * it said "crypto" without saying anything about the product. This leads
 * with the thing the product actually is: a portfolio with a balance and a
 * yield curve on it.
 *
 * The dashboard card is a static mockup, not a live view. It sits in front
 * of an unauthenticated visitor, so it must not read real balances; the
 * figures are illustrative and deliberately rounded rather than pulled from
 * anyone's account.
 */

const SPARK = [22, 30, 26, 41, 38, 52, 47, 61, 58, 55, 68, 74, 71, 86];

function Sparkline() {
  const w = 320;
  const h = 96;
  const pad = 8;
  const min = Math.min(...SPARK);
  const max = Math.max(...SPARK);
  const span = max - min || 1;
  const pts = SPARK.map((p, i) => [
    (i / (SPARK.length - 1)) * w,
    h - pad - ((p - min) / span) * (h - pad * 2),
  ]);
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const [lx, ly] = pts[pts.length - 1];

  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="my-1.5 h-24 w-full" aria-hidden="true">
      <defs>
        <linearGradient id="mp-hero-spark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--mp-accent)" stopOpacity="0.34" />
          <stop offset="100%" stopColor="var(--mp-accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g stroke="var(--mp-line)" strokeWidth="1">
        <line x1="0" y1="24" x2={w} y2="24" />
        <line x1="0" y1="52" x2={w} y2="52" />
        <line x1="0" y1="80" x2={w} y2="80" />
      </g>
      <path d={`${d} L${w} ${h} L0 ${h} Z`} fill="url(#mp-hero-spark)" />
      <path d={d} fill="none" stroke="var(--mp-accent)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lx - 2} cy={ly} r="4" fill="var(--mp-accent)" stroke="var(--mp-surface)" strokeWidth="2.5" />
    </svg>
  );
}

export const Hero: React.FC<{ onNavigate: (view: string) => void; isLoggedIn: boolean }> = ({
  onNavigate,
  isLoggedIn,
}) => {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative overflow-hidden px-4 pb-24 pt-14 sm:pt-20">
      {/* Dot grid, masked so it fades out rather than ending on a hard edge. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(var(--mp-accent)_1px,transparent_1px)] [background-size:26px_26px] opacity-[0.12]"
        style={{
          maskImage: "radial-gradient(ellipse 70% 60% at 50% 20%, #000, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse 70% 60% at 50% 20%, #000, transparent 75%)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[-10%] -translate-x-1/2 rounded-full blur-[50px]"
        style={{
          width: "min(120vw, 900px)",
          aspectRatio: "1",
          background:
            "radial-gradient(circle, color-mix(in srgb, var(--mp-accent) 13%, transparent), transparent 62%)",
        }}
      />

      <div className="relative mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1.02fr_0.98fr]">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
        >
          <span className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-accent-line bg-accent-soft py-1.5 pl-1.5 pr-3 text-2xs font-semibold text-accent">
            <span className="rounded-full bg-accent px-2 py-0.5 text-2xs uppercase tracking-[0.04em] text-ground">
              New
            </span>
            <Sparkles size={12} aria-hidden="true" />
            Moneta Prime v2.0 — explore vaults
            <ArrowUpRight size={12} aria-hidden="true" />
          </span>

          <h1 className="font-display text-[clamp(2.75rem,5.6vw,4.6rem)] font-normal leading-[1.03] tracking-tight text-ink text-balance">
            Institutional power.
            <br />
            <span className="bg-gradient-to-r from-accent to-accent-deep bg-clip-text text-transparent">
              Personal wealth.
            </span>
          </h1>

          <p className="mt-5 max-w-[52ch] text-base leading-relaxed text-muted">
            Automated yield strategies that compound on their own schedule, across crypto, equities
            and FX. Multi-signature custody and audited execution on every position.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              size="lg"
              iconRight={ArrowUpRight}
              onClick={() => onNavigate(isLoggedIn ? "dashboard" : "auth")}
            >
              Start building wealth
            </Button>
            <Button size="lg" variant="secondary" icon={Play} onClick={() => onNavigate("markets")}>
              Explore platform demo
            </Button>
          </div>
        </motion.div>

        {/* Dashboard mockup. Illustrative figures — never a real balance. */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.12, ease: "easeOut" }}
          className="group overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl transition-transform duration-500 lg:[transform:perspective(1400px)_rotateY(-9deg)_rotateX(3deg)] lg:hover:[transform:perspective(1400px)_rotateY(-4deg)_rotateX(1deg)] motion-reduce:transform-none"
        >
          <div className="flex items-center gap-1.5 border-b border-line bg-panel px-3.5 py-2.5">
            <span className="h-2 w-2 rounded-full bg-line-strong" />
            <span className="h-2 w-2 rounded-full bg-line-strong" />
            <span className="h-2 w-2 rounded-full bg-line-strong" />
            <span className="ml-2 font-data text-2xs text-faint">app.monetaprime.xyz</span>
          </div>

          <div className="p-5">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-2xs font-semibold uppercase tracking-[0.09em] text-faint">
                  Portfolio balance
                </p>
                <p className="mt-1 font-data text-3xl font-semibold tabular-nums tracking-tight text-ink">
                  $142,580.00
                </p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-positive-soft px-2.5 py-1 font-data text-xs font-semibold tabular-nums text-positive">
                <TrendingUp size={12} aria-hidden="true" /> +14.2%
              </span>
            </div>

            <Sparkline />

            <div className="grid grid-cols-3 gap-2">
              {[
                { k: "Vault APY", v: "12.40%", tone: "text-positive" },
                { k: "Positions", v: "18", tone: "text-ink" },
                { k: "Settled", v: "<1.2s", tone: "text-ink" },
              ].map((m) => (
                <div key={m.k} className="rounded-xl border border-line bg-raised p-3">
                  <p className="text-[0.6rem] font-semibold uppercase tracking-[0.09em] text-faint">
                    {m.k}
                  </p>
                  <p className={`mt-0.5 font-data text-sm font-semibold tabular-nums ${m.tone}`}>
                    {m.v}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
