import React, { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Section, Container, SectionHeading } from "../ui/Layout";
import { useReveal } from "./useReveal";
// The three clips already in the repo. Asset-class mapping is taken from
// the previous HomeVideos component, which owned them before this section
// existed — video-stpo is the stocks reel despite the filename.
import videoForex from "../../video-forex.mp4";
import videoCrypto from "../../zero-crypo.mp4";
import videoStocks from "../../video-stpo.mp4";
// First frame of each clip, extracted with ffmpeg. Without a poster the
// cards sit black until played, because preload="none" fetches nothing.
import posterForex from "../../assets/posters/forex.jpg";
import posterCrypto from "../../assets/posters/crypto.jpg";
import posterStocks from "../../assets/posters/stocks.jpg";

/**
 * Market intelligence videos.
 *
 * Three self-hosted clips, one per asset class, bundled from src/*.mp4.
 * They are ambient: muted, looping, no controls and no play button — the
 * motion is the point, and a visitor is never asked to start or stop one.
 *
 * Three things make that safe rather than expensive:
 *
 * - Autoplay only ever happens MUTED. Every browser blocks autoplay with
 *   sound, so an unmuted clip here would simply never start.
 * - Playback is driven by an IntersectionObserver, not the autoplay
 *   attribute, so `preload="none"` still holds: nothing is fetched until
 *   the section scrolls into view, and clips pause again once it leaves.
 *   1.8 MB of video should not load for a visitor who never gets here,
 *   and three loops should not burn CPU while off-screen.
 * - Under `prefers-reduced-motion` nothing plays at all; the card shows
 *   its poster frame instead. A 6–7s loop running forever beside other
 *   content is precisely what that preference exists to suppress, and it
 *   doubles as the pause mechanism WCAG 2.2.2 asks for, without putting
 *   controls on a section that is meant to be decorative.
 *
 * A card whose `src` is empty falls back to a labelled placeholder rather
 * than an empty black box, so a missing clip reads as unfinished rather
 * than broken.
 */

interface MarketVideo {
  id: string;
  title: string;
  blurb: string;
  /** Bundled clip. Empty renders the labelled placeholder instead. */
  src: string;
  /** First frame, shown before playback. Without it the card sits black. */
  poster?: string;
}

const MARKETS: MarketVideo[] = [
  {
    id: "forex",
    title: "Forex",
    blurb: "Navigate fiat currency pairs with institutional liquidity.",
    src: videoForex,
    poster: posterForex,
  },
  {
    id: "crypto",
    title: "Crypto",
    blurb: "Yield generation and high-frequency trading in Web3.",
    src: videoCrypto,
    poster: posterCrypto,
  },
  {
    id: "stocks",
    title: "Stocks",
    blurb: "Algorithmic execution for global equities and indices.",
    src: videoStocks,
    poster: posterStocks,
  },
];

const VideoCard: React.FC<{ video: MarketVideo; delay: number }> = ({ video, delay }) => {
  const reveal = useReveal(delay);
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);
  const hasSource = video.src.trim().length > 0;

  useEffect(() => {
    const el = ref.current;
    if (!el || !hasSource || reduceMotion) return;

    // Play only while the card is actually on screen. Without this the
    // three clips decode continuously for the whole session, including
    // while the visitor is reading something else entirely.
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // play() rejects if the browser still refuses autoplay. Swallow
          // it and fall back to the poster rather than logging on every
          // scroll — the card stays a still image, which is fine.
          void el.play().catch(() => setFailed(true));
        } else {
          el.pause();
        }
      },
      { threshold: 0.25 }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [hasSource, reduceMotion]);

  return (
    <motion.article
      {...reveal}
      className={
        "group overflow-hidden rounded-2xl border border-line bg-surface " +
        "transition-[transform,border-color,box-shadow] duration-300 " +
        "hover:-translate-y-2 hover:border-accent-line " +
        "hover:shadow-[0_18px_44px_color-mix(in_srgb,var(--mp-accent)_18%,transparent)] " +
        "motion-reduce:hover:translate-y-0"
      }
    >
      {/* Square, not 16:9. Every source clip is square (720x720 / 1280x1280),
          and a 16:9 frame with object-cover crops ~44% of the height — enough
          to cut the phone mockup out of two of them. Matching the source is
          the only framing that shows the whole clip. */}
      <div className="relative grid aspect-square place-items-center overflow-hidden border-b border-line bg-panel">
        {hasSource ? (
          <video
            ref={ref}
            className="h-full w-full object-cover"
            // muted is not optional: autoplay with sound is blocked
            // everywhere, so without it these would never start.
            muted
            loop
            playsInline
            preload="none"
            poster={video.poster}
            aria-label={`${video.title} — looping background clip`}
            onError={() => setFailed(true)}
          >
            <source src={video.src} type="video/mp4" />
          </video>
        ) : (
          /* Stand-in until a URL is supplied — deliberately labelled rather
             than an empty black box, so it is obvious this is unfinished
             rather than broken. */
          <div
            className="absolute inset-0 grid place-items-center bg-[repeating-linear-gradient(45deg,var(--mp-raised)_0_10px,var(--mp-panel)_10px_20px)] font-data text-2xs tracking-[0.06em] text-faint"
            aria-hidden="true"
          >
            YOUR_VIDEO_URL_HERE
          </div>
        )}

        {/* If the clip could not decode at all, the poster is still showing
            underneath — but say so rather than leaving a silent still. */}
        {failed && (
          <span className="absolute bottom-2 right-2 rounded-md bg-ground/75 px-2 py-1 font-data text-[0.6rem] text-faint">
            preview unavailable
          </span>
        )}
      </div>

      <div className="p-5">
        {/* No asset-class pill above the heading — it repeated the title
            verbatim, which reads as a rendering fault rather than a label. */}
        <h3 className="text-base font-semibold tracking-tight text-ink">{video.title}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-muted">{video.blurb}</p>
      </div>
    </motion.article>
  );
};

export const VideoMarkets: React.FC = () => (
  <Section divided className="bg-ground" id="learn">
    <Container>
      <div className="text-center">
        <SectionHeading
          eyebrow="Market intelligence"
          title="Master the markets"
          description="Real-time analysis and strategies across global asset classes."
        />
      </div>

      <div className="mt-11 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {MARKETS.map((video, i) => (
          <VideoCard key={video.id} video={video} delay={i * 0.05} />
        ))}
      </div>
    </Container>
  </Section>
);
