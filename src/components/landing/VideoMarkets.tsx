import React, { useRef, useState } from "react";
import { motion } from "motion/react";
import { Play } from "lucide-react";
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
 *
 * `preload="none"` is deliberate and load-bearing: the section sits well
 * below the fold, and three clips buffering on page load would be the
 * single heaviest thing on the landing page for something most visitors
 * never scroll to. Nothing is fetched until the visitor presses play.
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
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const hasSource = video.src.trim().length > 0;

  const start = () => {
    const el = ref.current;
    if (!el || !hasSource) return;
    void el.play();
    setPlaying(true);
  };

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
            preload="none"
            playsInline
            controls={playing}
            poster={video.poster}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
          >
            <source src={video.src} type="video/mp4" />
            Your browser does not support embedded video.
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

        {/* Play affordance. Fades in on hover or keyboard focus; hidden once
            playback starts so it never covers the native controls. */}
        {!playing && (
          <button
            type="button"
            onClick={start}
            aria-label={`Play the ${video.title} overview`}
            className={
              "absolute inset-0 grid cursor-pointer place-items-center border-0 bg-ground/45 " +
              "opacity-0 transition-opacity duration-300 group-hover:opacity-100 focus-visible:opacity-100 " +
              "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
            }
          >
            <span
              className={
                "grid h-14 w-14 scale-[0.82] place-items-center rounded-full bg-accent text-ground " +
                "shadow-[0_8px_28px_color-mix(in_srgb,var(--mp-accent)_45%,transparent)] " +
                "transition-transform duration-300 group-hover:scale-100 motion-reduce:transition-none"
              }
            >
              <Play size={20} fill="currentColor" aria-hidden="true" />
            </span>
          </button>
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
