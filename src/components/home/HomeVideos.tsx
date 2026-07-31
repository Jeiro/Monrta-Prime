import React, { useState } from 'react';
import { motion } from 'motion/react';
import { LineChart, Bitcoin, Globe } from 'lucide-react';
import videoForex from '../../video-forex.mp4';
import videoStpo from '../../video-stpo.mp4';
import zeroCrypo from '../../zero-crypo.mp4';
import { Section, Container, SectionHeading } from '../ui/Layout';

/**
 * Market showcase.
 *
 * Was three full-width videos stacked in a max-w-4xl column with 96-128px
 * gaps — 3,752px of page, and all three videos decoding at once on load.
 * Now one band with the markets as tabs: same three markets, same copy, but
 * only the selected video is mounted, so exactly one decodes.
 */

const MARKETS = [
  {
    id: 'stocks',
    label: 'Stocks',
    title: 'Stocks Trading',
    icon: LineChart,
    text: "Trade over 100 global markets, including popular stocks such as AAPL, TSLA, and NVDA. Access equities, indices, and ETFs from a single platform with real-time data, advanced charting, and seamless execution.",
    stats: [['Markets', '100+'], ['Order types', '8'], ['Settlement', 'T+0']],
    video: videoStpo,
  },
  {
    id: 'crypto',
    label: 'Crypto Futures',
    title: 'Crypto Futures Trading',
    icon: Bitcoin,
    text: "Deep liquidity and institutional-grade infrastructure. Trade Bitcoin, Ethereum, and a wide array of altcoins with advanced order types, zero-latency execution, and robust risk management, 24/7.",
    stats: [['Pairs', '40+'], ['Uptime', '99.9%'], ['Availability', '24/7']],
    video: zeroCrypo,
  },
  {
    id: 'forex',
    label: 'Forex',
    title: 'Forex Markets',
    icon: Globe,
    text: "Major, minor, and exotic currency pairs with ultra-tight spreads and rapid execution. Access global liquidity pools, advanced technical indicators, and comprehensive market analysis around the clock.",
    stats: [['Pairs', '60+'], ['Spreads', 'from 0.1'], ['Execution', '<10ms']],
    video: videoForex,
  },
] as const;

export const HomeVideos = () => {
  const [active, setActive] = useState(0);
  const market = MARKETS[active];

  return (
    <Section divided className="bg-ground overflow-hidden">
      <Container>
        <SectionHeading
          eyebrow="Markets"
          title="Three markets, one workspace"
          description="Switch between equities, crypto futures, and FX without leaving the terminal."
        />

        {/* Market tabs */}
        <div className="mt-8 flex justify-center">
          <div
            role="tablist"
            aria-label="Markets"
            className="inline-flex items-center gap-1 rounded-lg border border-line bg-surface p-1"
          >
            {MARKETS.map((m, i) => {
              const Icon = m.icon;
              const on = i === active;
              return (
                <button
                  key={m.id}
                  role="tab"
                  aria-selected={on}
                  aria-controls="market-panel"
                  onClick={() => setActive(i)}
                  className={`inline-flex items-center gap-2 rounded-md px-3.5 py-2 text-sm font-medium transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                    on ? 'bg-accent text-ground' : 'text-muted hover:text-ink hover:bg-raised'
                  }`}
                >
                  <Icon size={15} />
                  {m.label}
                </button>
              );
            })}
          </div>
        </div>

        <motion.div
          id="market-panel"
          role="tabpanel"
          key={market.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.15fr] lg:items-center"
        >
          <div className="flex flex-col gap-4">
            <h3 className="text-2xl sm:text-3xl font-semibold tracking-tight text-ink">
              {market.title}
            </h3>
            <p className="text-base leading-relaxed text-muted">{market.text}</p>

            <dl className="mt-1 grid grid-cols-3 gap-3">
              {market.stats.map(([label, value]) => (
                <div key={label} className="rounded-lg border border-line bg-surface px-3 py-2.5">
                  <dt className="text-2xs font-semibold uppercase tracking-[0.09em] text-faint">
                    {label}
                  </dt>
                  <dd className="mt-1 font-data tabular-nums text-lg font-semibold text-ink">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Only the active video is mounted, so only one decodes.
              The source clips are portrait; h-auto let them run ~900px tall
              and dragged the whole band with them. Fixed landscape frame. */}
          <div className="relative aspect-[16/10] overflow-hidden rounded-xl border border-line bg-black">
            <video
              key={market.video}
              src={market.video}
              className="absolute inset-0 h-full w-full object-cover"
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
            />
          </div>
        </motion.div>
      </Container>
    </Section>
  );
};
