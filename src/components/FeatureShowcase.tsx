import React, { useEffect, useRef } from "react";
import { motion } from "motion/react";
import { 
  ArrowRight, ShieldCheck, Cpu, Wallet, TrendingUp, Sparkles, Zap
} from "lucide-react";

interface ScrollRevealProps {
  children: React.ReactNode;
  delay?: number;
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({ children, delay = 0 }) => {
  return (
    <motion.div
      initial={{ y: 30, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.5, delay: delay }}
      className="w-full"
    >
      {children}
    </motion.div>
  );
};

const TradingViewWidget: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let scriptLoaded = false;
    const scriptId = "tradingview-widget-script";
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;

    const initWidget = () => {
      if (containerRef.current && (window as any).TradingView) {
        // Clear previous widget placeholder
        containerRef.current.innerHTML = `<div id="tradingview_btc_chart" style="height: 100%; width: 100%; min-height: 340px;" />`;
        new (window as any).TradingView.widget({
          autosize: true,
          symbol: "BINANCE:BTCUSDT",
          interval: "15",
          timezone: "Etc/UTC",
          theme: "dark",
          style: "1",
          locale: "en",
          enable_publishing: false,
          hide_side_toolbar: false,
          allow_symbol_change: true,
          container_id: "tradingview_btc_chart",
        });
      }
    };

    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://s3.tradingview.com/tv.js";
      script.type = "text/javascript";
      script.async = true;
      script.onload = () => {
        initWidget();
      };
      document.head.appendChild(script);
    } else {
      if ((window as any).TradingView) {
        initWidget();
      } else {
        script.addEventListener("load", initWidget);
      }
    }

    return () => {
      const existingScript = document.getElementById(scriptId);
      if (existingScript) {
        existingScript.removeEventListener("load", initWidget);
      }
    };
  }, []);

  return (
    <div className="w-full h-full min-h-[340px]" ref={containerRef}>
      <div id="tradingview_btc_chart" className="w-full h-full" style={{ minHeight: "340px" }} />
    </div>
  );
};

interface FeatureShowcaseProps {
  onNavigate?: (view: string) => void;
}

export const FeatureShowcase: React.FC<FeatureShowcaseProps> = ({ onNavigate }) => {
  const handleStartTrading = () => {
    if (onNavigate) {
      onNavigate("auth");
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="w-full space-y-32 py-16 bg-[#000000] text-ink overflow-hidden font-sans">
      
      {/* ======================================================= */}
      {/* SECTION 4: The Benchmark for Secure Multi-Asset Investing */}
      {/* ======================================================= */}
      <section className="max-w-7xl mx-auto px-4 relative">
        <ScrollReveal>
          <div className="relative rounded-3xl p-8 sm:p-12 lg:p-16 border border-line/30 bg-[#07090C] overflow-hidden group shadow-2xl">
            {/* Soft glowing vector grid columns background */}
            <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#6AA5FF_1px,transparent_1px)] bg-[size:5rem_5rem]" />
            <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-accent/5 blur-[120px]" />
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
              
              {/* Left Column: Copy Content matching Image 4 */}
              <div className="lg:col-span-7 space-y-6 text-left">
                <span className="text-2xs font-bold font-subheading tracking-[0.25em] text-accent uppercase block">
                  MAIN FEATURES
                </span>
                
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-heading text-ink tracking-tight leading-[1.12]">
                  The Benchmark for Secure Multi-Asset Investing
                </h2>
                
                <p className="text-sm sm:text-base text-muted leading-relaxed max-w-xl font-sans font-light">
                  Join a network of over 6,000 elite investors who rely on TenVault to automate their growth. Sync your portfolio with top-tier strategists and experience institutional-grade execution in real-time.
                </p>
                
                <div className="pt-4">
                  <button
                    onClick={handleStartTrading}
                    className="px-8 py-4 rounded-xl bg-accent hover:bg-accent-hover text-ground font-extrabold font-subheading text-xs uppercase tracking-wider shadow-lg shadow-accent/10 hover:shadow-accent/20 transition-all flex items-center gap-2 group cursor-pointer"
                  >
                    Start Trading
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>

              {/* Right Column: Fading pillar bar graph matching background of Image 4 */}
              <div className="lg:col-span-5 flex items-end justify-center h-64 lg:h-80 relative select-none">
                <div className="flex gap-3 items-end h-full w-full max-w-xs justify-center">
                  {[0.12, 0.22, 0.35, 0.48, 0.65, 0.82, 1.0].map((heightPct, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ height: 0 }}
                      whileInView={{ height: `${heightPct * 80}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, delay: idx * 0.1, ease: "easeOut" }}
                      className="w-8 rounded-t-lg relative group"
                      style={{
                        background: idx === 6 
                          ? "linear-gradient(to top, rgba(106,165,255, 0.05), rgba(106,165,255, 0.45))" 
                          : "linear-gradient(to top, rgba(43, 49, 57, 0.05), rgba(132, 142, 156, 0.2))",
                        border: idx === 6 ? "1px solid rgba(106,165,255, 0.4)" : "1px solid rgba(43, 49, 57, 0.3)"
                      }}
                    >
                      {idx === 6 && (
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-accent/15 border border-accent/40 text-2xs text-accent font-mono font-bold px-1.5 py-0.5 rounded shadow">
                          Max
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* ======================================================= */}
      {/* SECTION 5: Stocks Trading (Spacious TradingView Dashboard) */}
      {/* ======================================================= */}
      <section className="max-w-7xl mx-auto px-4 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left: Beautiful spacious live chart panel */}
          <div className="lg:col-span-7 flex justify-center relative order-2 lg:order-1 w-full">
            <ScrollReveal>
              <div className="relative w-full rounded-2xl border border-line/80 bg-ground p-5 sm:p-6 shadow-2xl flex flex-col group min-h-[460px]">
                
                {/* Subtle Amber Accent Glow */}
                <div className="absolute -inset-1 bg-gradient-to-tr from-accent/5 via-transparent to-transparent rounded-2xl blur-xl opacity-60 group-hover:opacity-100 transition-opacity" />

                {/* Main Header inside Card */}
                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-line/60 pb-4 mb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0ecb81] animate-ping" />
                      <span className="text-2xs uppercase tracking-wider text-accent font-extrabold font-mono">
                        BTCUSDT CRYPTO PAIR
                      </span>
                    </div>
                    <h4 className="text-2xl sm:text-3xl font-black text-ink font-heading tracking-tight">
                      $68,432.50
                    </h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xs text-[#0ecb81] font-bold font-mono bg-[#0ecb81]/10 border border-[#0ecb81]/25 px-2.5 py-1 rounded">
                      +1.87%
                    </span>
                    <span className="text-2xs font-mono text-faint bg-raised border border-line/80 px-2 py-1 rounded select-none uppercase">
                      Real-time Feed
                    </span>
                  </div>
                </div>

                {/* Interactive Candlestick Chart Widget Container */}
                <div className="relative z-10 flex-1 bg-[#0b0e14] border border-line rounded-xl overflow-hidden flex flex-col mb-5 min-h-[340px] shadow-inner">
                  <TradingViewWidget />
                </div>

                {/* Side-by-Side Buy/Sell action buttons */}
                <div className="relative z-10 grid grid-cols-2 gap-3 sm:gap-4">
                  <button
                    type="button"
                    onClick={handleStartTrading}
                    className="bg-[#0ecb81] hover:bg-[#0cb372] text-ink font-extrabold text-xs uppercase tracking-wider py-3.5 px-3 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer shadow-lg shadow-[#0ecb81]/10 focus:outline-none"
                  >
                    ↑ BUY BTC
                  </button>
                  <button
                    type="button"
                    onClick={handleStartTrading}
                    className="bg-[#f6465d] hover:bg-[#e03f53] text-ink font-extrabold text-xs uppercase tracking-wider py-3.5 px-3 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer shadow-lg shadow-[#f6465d]/10 focus:outline-none"
                  >
                    ↓ SELL BTC
                  </button>
                </div>

                {/* Tiny Floating decorative details */}
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                  className="absolute -right-3 -top-3 w-8 h-8 rounded-full border border-accent/20 bg-ground text-2xs font-bold text-accent font-mono flex items-center justify-center z-10 shadow"
                >
                  a
                </motion.div>

              </div>
            </ScrollReveal>
          </div>

          {/* Right: Stocks Trading Copy Panel matching Image 5 */}
          <div className="lg:col-span-5 space-y-6 text-left order-1 lg:order-2">
            <ScrollReveal>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent/10 border border-accent/25 rounded-md text-2xs uppercase font-bold text-accent tracking-widest">
                <TrendingUp size={12} /> Equities & Indices
              </div>
              
              <h3 className="text-3xl font-extrabold font-heading text-ink tracking-tight">
                Stocks Trading
              </h3>
              
              <p className="text-sm leading-relaxed text-muted font-sans font-light">
                Trade over 100 global markets, including popular stocks such as AAPL, TSLA, NVDA, and many more. Access a diverse range of equities, indices, and ETFs, all from a single platform designed for both new and experienced traders. Take advantage of real-time data, advanced charting tools, and seamless execution to maximize your trading opportunities across the world's leading financial markets.
              </p>

              <div className="pt-4">
                <button
                  onClick={handleStartTrading}
                  className="px-6 py-3 rounded-lg border border-line hover:border-accent text-ink hover:text-accent transition-all text-xs font-bold font-subheading uppercase tracking-wider bg-transparent cursor-pointer"
                >
                  Explore Stocks
                </button>
              </div>
            </ScrollReveal>
          </div>

        </div>
      </section>

      {/* ======================================================= */}
      {/* SECTION 6: Crypto Futures Trading (Metallic 0% visual) */}
      {/* ======================================================= */}
      <section className="max-w-7xl mx-auto px-4 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          
          {/* Left: Crypto Futures Copy Panel matching Image 6 */}
          <div className="lg:col-span-6 space-y-6 text-left">
            <ScrollReveal>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent/10 border border-accent/25 rounded-md text-2xs uppercase font-bold text-accent tracking-widest">
                <Zap size={12} /> Crypto Derivatives
              </div>
              
              <h3 className="text-3xl font-extrabold font-heading text-ink tracking-tight">
                Crypto Futures Trading
              </h3>
              
              <p className="text-sm leading-relaxed text-muted font-sans font-light">
                Trade Crypto Futures contracts like BTC, ETH, SOL, PEPE and more. Gain exposure to the most popular cryptocurrencies with advanced futures trading tools, allowing you to go long or short, manage leverage, and hedge your portfolio. Our platform supports a wide range of crypto assets, providing deep liquidity, competitive fees, and real-time risk management so you can trade confidently in any market condition.
              </p>

              <div className="pt-4">
                <button
                  onClick={handleStartTrading}
                  className="px-6 py-3 rounded-lg border border-line hover:border-accent text-ink hover:text-accent transition-all text-xs font-bold font-subheading uppercase tracking-wider bg-transparent cursor-pointer"
                >
                  Configure Leverage
                </button>
              </div>
            </ScrollReveal>
          </div>

          {/* Right: Gorgeous Metallic Ring with Zero percent (0%) and rotating coins matching Image 6 */}
          <div className="lg:col-span-6 flex justify-center relative">
            <ScrollReveal>
              <div className="relative w-full max-w-[340px] aspect-square rounded-3xl bg-transparent flex items-center justify-center text-ink select-none">
                
                {/* Embedded Glowing background rings */}
                <div className="absolute inset-0 rounded-full border border-line/40 scale-95" />
                <div className="absolute inset-0 rounded-full border border-accent/5 scale-105 blur-[1px]" />
                
                {/* Custom Vector Silver Chrome "0%" Graphic representing zero commissions */}
                <motion.div
                  animate={{ rotateY: [0, 8, 0, -8, 0] }}
                  transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                  className="relative z-15 p-12 bg-raised/40 rounded-full border border-line/40 shadow-2xl backdrop-blur-md flex items-center justify-center w-52 h-52 hover:scale-[1.05] transition-transform duration-500"
                >
                  <div className="text-center">
                    <span className="block text-2xs font-mono tracking-widest uppercase text-faint">Makers Fee</span>
                    <span className="block text-6xl font-black font-display tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-ink via-muted to-faint">
                      0%
                    </span>
                    <span className="block text-2xs font-bold text-accent bg-accent/15 border border-accent/30 rounded-full py-0.5 px-2 mt-1 uppercase w-fit mx-auto">
                      Sovereign Deal
                    </span>
                  </div>
                </motion.div>

                {/* Floating cryptocurrencies rotating surrounding orbit loop */}
                <motion.div
                  animate={{ 
                    x: [0, 60, -20, -50, 0],
                    y: [0, -40, 50, 10, 0] 
                  }}
                  transition={{ repeat: Infinity, duration: 7, ease: "easeInOut" }}
                  className="absolute pointer-events-none z-20"
                  style={{ top: "15%", left: "15%" }}
                >
                  {/* BTC Coin representation */}
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-accent/15 to-accent/80 border border-accent flex items-center justify-center shadow-lg shadow-accent/10 backdrop-blur-sm">
                    <span className="text-lg font-bold text-ink">₿</span>
                  </div>
                </motion.div>

                <motion.div
                  animate={{ 
                    x: [0, -70, -10, 60, 0],
                    y: [0, 50, -50, -10, 0] 
                  }}
                  transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
                  className="absolute pointer-events-none z-20"
                  style={{ bottom: "15%", right: "12%" }}
                >
                  {/* SOL / Custom purple coin */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#9945FF]/10 to-[#14F195]/85 border border-[#9945FF] flex items-center justify-center shadow-lg shadow-[#14F195]/10 backdrop-blur-sm">
                    <span className="text-xs font-bold text-ink">S</span>
                  </div>
                </motion.div>

                <motion.div
                  animate={{ 
                    x: [0, -30, 40, -40, 0],
                    y: [0, -60, 20, 60, 0] 
                  }}
                  transition={{ repeat: Infinity, duration: 9, ease: "easeInOut" }}
                  className="absolute pointer-events-none z-20"
                  style={{ top: "18%", right: "20%" }}
                >
                  {/* ETH Purple Coin */}
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#627eea]/15 to-[#627eea]/80 border border-[#627eea] flex items-center justify-center shadow-lg shadow-[#627eea]/10 backdrop-blur-sm">
                    <span className="text-xs font-bold text-ink">Ξ</span>
                  </div>
                </motion.div>

              </div>
            </ScrollReveal>
          </div>

        </div>
      </section>

    </div>
  );
};
