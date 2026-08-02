import React from "react";
import { useSeo } from "../lib/useSeo";
import { useSession } from "../context/domains/SessionContext";
import { ArrowUpRight } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
// No <Footer> here: App.tsx renders one globally for every non-admin,
// non-auth route, so rendering it again stacked two footers on the homepage.
import { TradeFeatures, InvestmentPlansSection, Proof, Closing, HomeVideos } from "../components/HomeSections";
import { Brandmark } from "../components/ui/Brandmark";
import { Button } from "../components/ui";
import heroTerminal1600 from "../assets/hero-market-terminal-1600.jpg";
import heroTerminal800 from "../assets/hero-market-terminal-800.jpg";

/**
 * The hero's orbiting asset marks.
 *
 * `size` is a share of the orbit box, not a pixel width — the three rings were
 * 190/300/420px against a 420px composition, which is 45%/71%/100%; they are
 * held at 92% of that here so the token glyphs sitting on the outer
 * circumference stay inside the box rather than relying on overflow.
 *
 * `scale` is the glyph's font size as a share of the orbit box, so a four-letter
 * ticker on the outer ring stays inside its dot at every width.
 */
const ORBIT_RINGS = [
  {
    id: "crypto",
    size: "42%",
    duration: 16,
    direction: 1,
    border: "border border-line/60 border-dashed",
    tokens: [
      { label: "₿", bg: "bg-accent", color: "text-ground", angle: 0, scale: 0.034 },
      { label: "Ξ", bg: "bg-[#4E62CC]", color: "text-white", angle: 120, scale: 0.034 },
      { label: "₮", bg: "bg-[#26A17B]", color: "text-white", angle: 240, scale: 0.034 },
    ],
  },
  {
    id: "equities",
    size: "66%",
    duration: 25,
    direction: -1,
    border: "border border-line/40 border-dotted",
    tokens: [
      { label: "T", bg: "bg-[#E82127]", color: "text-white", angle: 0, scale: 0.03 },
      { label: "", bg: "bg-white", color: "text-black", angle: 72, scale: 0.03 },
      { label: "NV", bg: "bg-[#76B900]", color: "text-black", angle: 144, scale: 0.026 },
      { label: "G", bg: "bg-[#4285F4]", color: "text-white", angle: 216, scale: 0.03 },
      { label: "a", bg: "bg-[#FF9900]", color: "text-black", angle: 288, scale: 0.03 },
    ],
  },
  {
    id: "global",
    size: "92%",
    duration: 38,
    direction: 1,
    border: "border border-line/20",
    tokens: [
      { label: "AVAX", bg: "bg-[#E84142]", color: "text-white", angle: 0, scale: 0.019 },
      { label: "Đ", bg: "bg-[#C2A633]", color: "text-black", angle: 45, scale: 0.03 },
      { label: "LINK", bg: "bg-[#375BD2]", color: "text-white", angle: 90, scale: 0.019 },
      { label: "DOT", bg: "bg-[#E6007A]", color: "text-white", angle: 135, scale: 0.021 },
      { label: "TRX", bg: "bg-[#EC0623]", color: "text-white", angle: 180, scale: 0.021 },
      { label: "LTC", bg: "bg-[#345D9D]", color: "text-white", angle: 225, scale: 0.021 },
      { label: "🚀", bg: "bg-gradient-to-tr from-[#1D4ED8] to-[#1E3A8A]", color: "text-white", angle: 270, scale: 0.028 },
      { label: "MS", bg: "bg-[#00A4EF]", color: "text-white", angle: 315, scale: 0.026 },
    ],
  },
] as const;

export const PublicHome: React.FC<{ onNavigate: (view: string) => void }> = ({ onNavigate }) => {
  useSeo({
    title: "Moneta Prime — Crypto Trading, Copy Trading & Investment Plans",
    description: "Trade crypto with precision on Moneta Prime. Real-time markets, tiered investment plans, and copy trading in one workspace built for serious traders.",
    path: "/",
  });
  const { user } = useSession();
  // Matches every other motion consumer in the app (RouteTransition,
  // Progress, AnimatedNumber, ScrollAnimatedBackground).
  const reduceMotion = useReducedMotion();

  return (
    <div className="min-h-screen bg-transparent text-ink font-sans selection:bg-accent/20 overflow-x-hidden pt-0">
      
      {/* 1. HERO BANNER: METRICS & EXQUISITE CELESTIAL ORBITING SYSTEM */}
      <section className="relative flex flex-col justify-center items-center bg-gradient-to-b from-ground via-panel to-panel border-b border-line/30 px-4 overflow-hidden pt-14 sm:pt-16 pb-14">
        
        {/* Photographic base layer.
            The hero was 100% gradients, SVG and icons before this. The photo is
            a real market terminal, and it is deliberately the bottom layer
            rather than a framed image beside the copy: it gives the section
            texture without competing with the headline.

            Treatment: the image is desaturated and dimmed, then covered by a
            --mp-ground gradient that is opaque at the bottom and clears toward
            the top. That is what keeps it reading as part of the palette
            instead of a bright rectangle — the section's own ground colour
            literally sits on top of it, so it inherits the theme. In light
            mode the same gradient is near-white, which washes the photo out to
            a pale texture rather than leaving a dark block on a light page.

            aria-hidden + empty alt: it carries no information the copy does not
            already state, so a screen reader should skip it. */}
        {/* Fades in on mount rather than on scroll: it is above the fold, so a
            whileInView trigger would fire immediately anyway. Opacity only —
            a y-translate on a full-bleed backdrop reads as the page shifting
            under the headline. Duration/easing match the page's other fades
            (see Proof.tsx). */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="absolute inset-0 overflow-hidden pointer-events-none"
          aria-hidden="true"
        >
          <img
            src={heroTerminal1600}
            srcSet={`${heroTerminal800} 800w, ${heroTerminal1600} 1600w`}
            sizes="100vw"
            alt=""
            loading="eager"
            fetchPriority="high"
            decoding="async"
            className="h-full w-full object-cover opacity-[0.3] saturate-50"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-ground/55 via-ground/80 to-ground" />
        </motion.div>

        {/* Subtle grid background effects */}
        <div className="absolute inset-0 bg-[radial-gradient(var(--mp-accent)_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.12] pointer-events-none" />
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-accent/5 rounded-full blur-[140px] pointer-events-none"
          style={{ width: "min(150vw, 37.5rem)", height: "min(150vw, 37.5rem)" }}
        />
        
        <div className="max-w-4xl mx-auto w-full relative z-20 text-center flex flex-col items-center mt-2">
          
          {/* Main Display Typography */}
          <div className="space-y-4 max-w-3xl">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-6xl font-extrabold text-ink tracking-tight leading-tight max-w-4xl mx-auto font-sans">
              Trade Smarter With <span className="lowercase text-ink font-extrabold">moneta <span className="text-accent">prime</span></span>
            </h1>
            <p className="text-muted text-sm sm:text-base max-w-md mx-auto leading-relaxed">
              Access global markets through a secure, data-driven trading platform. Built for traders and investors who demand precision, speed, and reliability.
            </p>
          </div>

          {/* Golden Highlight Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8 w-full max-w-lg">
            <Button
              size="lg"
              iconRight={ArrowUpRight}
              className="w-full sm:w-auto"
              onClick={() => onNavigate(user.isLoggedIn ? "dashboard-trading" : "auth")}
            >
              Start Trading
            </Button>
            <Button
              variant="secondary"
              size="lg"
              className="w-full sm:w-auto"
              onClick={() => onNavigate("markets")}
            >
              Explore Markets
            </Button>
          </div>

          {/* CELESTIAL ORBIT SYSTEM

              One fluid composition, not a fixed one scaled down. `--orbit` is
              the single dimension the whole thing derives from; every ring,
              icon and glyph below is a percentage or a calc() of it, so the
              art resolves itself at any width instead of being authored at
              420px and shrunk with a scale() transform at three breakpoints.

              That old approach had two sizing systems fighting: the container
              had its own breakpoint heights (240/280/340/500px) while the
              contents were scaled independently (0.62/0.72/0.85/1), so the
              box and the art it contained disagreed at every width between
              the breakpoints. Rings are now sized as a share of the box, and
              tokens sit on the circumference via a rotated frame rather than
              a hardcoded translateY radius. */}
          <div
            className="relative mt-6 sm:mt-10 flex items-center justify-center select-none"
            style={{
              // 15rem floor keeps the glyphs legible on a 320px phone; the
              // 28rem ceiling matches the old sm:scale-100 size, so the
              // composition tops out where it always did.
              ["--orbit" as string]: "clamp(15rem, 74vw, 28rem)",
              width: "var(--orbit)",
              height: "var(--orbit)",
            }}
          >
            {/* Ambient glow */}
            <div className="absolute w-1/2 h-1/2 bg-accent/10 rounded-full blur-[60px]" />

            {/* Central brand core */}
            <div
              className="absolute rounded-full bg-transparent border-2 border-accent/20 flex flex-col items-center justify-center z-30 shadow-[0_0_50px_color-mix(in_srgb,var(--mp-accent)_15%,transparent)]"
              style={{ width: "39%", height: "39%" }}
            >
              {/* Sized by a wrapper: Brandmark takes only className, and it is
                  the app's logo — not something to widen the API of from here. */}
              <div style={{ width: "calc(var(--orbit) * 0.115)", height: "calc(var(--orbit) * 0.115)" }}>
                <Brandmark className="w-full h-full transition-transform duration-500 hover:rotate-6 drop-shadow-[0_4px_16px_color-mix(in_srgb,var(--mp-accent)_40%,transparent)]" />
              </div>
              <span
                className="text-ink font-bold tracking-[0.05em] mt-2 font-sans lowercase leading-none"
                style={{ fontSize: "calc(var(--orbit) * 0.036)" }}
              >
                moneta <span className="text-accent">prime</span>
              </span>
            </div>

            {ORBIT_RINGS.map(ring => (
              <motion.div
                key={ring.id}
                // Reduced motion: the rings hold still. A continuous, unending
                // 360deg loop is the archetypal case the preference exists for,
                // and there is no information in the spin — the composition
                // reads the same frozen. Same for the counter-rotation below,
                // which only exists to cancel this one out.
                animate={reduceMotion ? { rotate: 0 } : { rotate: ring.direction * 360 }}
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : { repeat: Infinity, duration: ring.duration, ease: "linear" }
                }
                className={`absolute rounded-full z-10 ${ring.border}`}
                style={{ width: ring.size, height: ring.size }}
              >
                {ring.tokens.map((token, index) => (
                  // A rotated frame filling the ring, with the token pinned to
                  // the top edge. The radius is therefore half the ring's own
                  // height — relative by construction, so it stays on the
                  // circumference at any --orbit value. The old code hardcoded
                  // it as translateY(-95px|-150px|-210px).
                  <div
                    key={index}
                    className="absolute inset-0"
                    style={{ transform: `rotate(${token.angle}deg)` }}
                  >
                    <div
                      className="absolute left-1/2 top-0"
                      style={{ transform: `translate(-50%, -50%) rotate(${-token.angle}deg)` }}
                    >
                      {/* Counter-rotation keeps each glyph upright while the
                          ring turns. */}
                      <motion.div
                        animate={reduceMotion ? { rotate: 0 } : { rotate: ring.direction * -360 }}
                        transition={
                          reduceMotion
                            ? { duration: 0 }
                            : { repeat: Infinity, duration: ring.duration, ease: "linear" }
                        }
                        className={`${token.bg} ${token.color} rounded-full flex items-center justify-center font-bold leading-none shadow-[0_0_12px_color-mix(in_srgb,var(--mp-ground)_80%,transparent)] border border-white/10`}
                        style={{
                          width: "calc(var(--orbit) * 0.07)",
                          height: "calc(var(--orbit) * 0.07)",
                          fontSize: `calc(var(--orbit) * ${token.scale ?? 0.03})`,
                        }}
                      >
                        {token.label}
                      </motion.div>
                    </div>
                  </div>
                ))}
              </motion.div>
            ))}

            {/* Brand motto, held just below the outer ring. */}
            <div className="absolute left-1/2 -translate-x-1/2 z-20 whitespace-nowrap" style={{ bottom: "-1.5rem" }}>
              <span
                className="font-mono tracking-[0.25em] font-semibold text-accent uppercase"
                style={{ fontSize: "clamp(0.5rem, 2.2vw, 0.625rem)" }}
              >
                Trade • Compound • Preserve
              </span>
            </div>

          </div>

          {/* Minimal low-profile Hero Metrics Section replaced with Markets section */}
        </div>

      </section>

      {/* Five bands, down from ten. WhyMonetaPrime + Confidence merged into
          <Proof />; AboutUs + GetStarted merged into <Closing />; HomeVideos
          is now a tabbed market showcase rather than three stacked videos.
          No content was dropped — the old components remain exported for the
          dashboard/legal pages that still import them. */}
      <TradeFeatures onNavigate={onNavigate} />
      <InvestmentPlansSection onNavigate={onNavigate} />
      <HomeVideos />
      <Proof />
      {/* Testimonials section intentionally absent: the previous one shipped
          invented customer reviews and an invented aggregate rating. Pending
          real, attributable customer testimonials — do not re-add a version
          with placeholder or sample names. <Testimonials /> still exists and
          now takes its content as a prop; give it real data to bring it back. */}
      <Closing onNavigate={onNavigate} />
    </div>
  );
};
