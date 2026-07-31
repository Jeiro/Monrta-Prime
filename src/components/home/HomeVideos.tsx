import React from 'react';
import { motion } from 'motion/react';
import videoForex from '../../video-forex.mp4';
import videoStpo from '../../video-stpo.mp4';
import zeroCrypo from '../../zero-crypo.mp4';

const SECTIONS = [
  {
    title: "Stocks Trading",
    text: "Trade over 100 global markets, including popular stocks such as AAPL, TSLA, NVDA, and many more. Access a diverse range of equities, indices, and ETFs, all from a single platform designed for both new and experienced traders. Take advantage of real-time data, advanced charting tools, and seamless execution to maximize your trading opportunities across the world's leading financial markets.",
    video: videoStpo,
  },
  {
    title: "Crypto Futures Trading",
    text: "Access deep liquidity and institutional-grade trading infrastructure. Trade Bitcoin, Ethereum, and a wide array of altcoins with industry-leading conditions. Our platform offers advanced order types, zero-latency execution, and robust risk management tools to help you capitalize on crypto market volatility 24/7.",
    video: zeroCrypo,
  },
  {
    title: "Forex Markets",
    text: "Trade major, minor, and exotic currency pairs with ultra-tight spreads and rapid execution. Our professional-grade forex trading environment provides access to global liquidity pools, advanced technical indicators, and comprehensive market analysis to support your trading strategies around the clock.",
    video: videoForex,
  }
];

export const HomeVideos = () => {
  return (
    <section className="py-16 bg-ground relative overflow-hidden">
      <div className="max-w-4xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10 flex flex-col gap-24 md:gap-32">

        {SECTIONS.map((section, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="flex flex-col gap-6 md:gap-8"
          >
            {/* Text Content */}
            <div>
              <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-5 md:mb-6">
                {section.title}
              </h2>
              <p className="text-slate-400 text-base md:text-lg leading-relaxed md:leading-loose">
                {section.text}
              </p>
            </div>

            {/* Video Container */}
            <div className="w-full rounded-3xl overflow-hidden border border-line/60 shadow-2xl bg-black relative">
              <video
                src={section.video}
                className="w-full h-auto object-cover"
                autoPlay
                loop
                muted
                playsInline
              />
              {/* Optional glowing effect behind video container */}
              <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(0,0,0,0.8)] pointer-events-none" />
            </div>
          </motion.div>
        ))}

      </div>
    </section>
  );
};
