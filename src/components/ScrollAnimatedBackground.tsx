import React, { useEffect, useState } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";

export const ScrollAnimatedBackground: React.FC = () => {
  const prefersReducedMotion = useReducedMotion();
  // Initialized synchronously: starting at `false` and correcting in an
  // effect made React delete the entire desktop tree right after mount on
  // compact devices — a huge deletion commit that crashed with
  // "removeChild: node is not a child" whenever a third-party script
  // (Tawk, extensions) had touched those nodes in between.
  const [isCompactDevice, setIsCompactDevice] = useState(
    () => window.matchMedia("(max-width: 767px)").matches
  );
  const { scrollY } = useScroll();

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const updateDeviceMode = () => setIsCompactDevice(mediaQuery.matches);
    mediaQuery.addEventListener("change", updateDeviceMode);
    return () => mediaQuery.removeEventListener("change", updateDeviceMode);
  }, []);

  // Create smooth parallax translation rates to give depth to background assets
  const yFast = useTransform(scrollY, [0, 4000], [0, -400]);
  const yMedium = useTransform(scrollY, [0, 4000], [0, -200]);
  const ySlow = useTransform(scrollY, [0, 4000], [0, -100]);

  if (isCompactDevice || prefersReducedMotion) {
    return (
      <div className="absolute inset-0 w-full pointer-events-none select-none z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[#04060b]" />
        <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-accent/[0.07] blur-[70px]" />
        <div className="absolute top-1/3 -right-24 h-72 w-72 rounded-full bg-accent/[0.05] blur-[65px]" />
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.14) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.14) 1px, transparent 1px)",
            backgroundSize: "42px 42px"
          }}
        />
      </div>
    );
  }
  // Financial streams mock data for data waterfalls
  const dataColumns = [
    ["BTC 94,820", "▲ 4.82%", "USDT TRC20", "TXN_7386", "ETH 3,450", "▲ 2.11%", "SOL 184.2", "SECURE", "moneta"],
    ["ETH 3,450", "▼ 1.05%", "GAS 12Gwei", "TXN_9912", "USDT ERC20", "ACTIVE", "BTC 94,820", "GOLD", "BL_0921"],
    ["MPRX 4.50", "▲ 15.34%", "SWAP ACTIVE", "MKT_MPX_9", "BTC 94,820", "SOL 184.2", "▲ 7.42%", "USD_WIRE", "SECURE"],
    ["SOL 184.2", "▲ 7.42%", "TRD_STB_2", "TXN_1120", "ETH 3,450", "▲ 2.11%", "MKT_EX", "USDT TRC20", "moneta"]
  ];

  return (
    <div className="absolute inset-0 w-full pointer-events-none select-none z-0 overflow-hidden" style={{ minHeight: "100%" }}>
      {/* 1. DARK NAVY AND CHARCOAL BACKGROUND */}
      <div className="absolute inset-0 bg-[#04060b]" />
      
      {/* Dynamic atmospheric radial gradient glows (blue and gold) */}
      <div className="absolute top-0 left-[-10%] w-[60%] h-[750px] rounded-full bg-gradient-to-br from-accent/[0.08] via-accent/[0.04] to-transparent blur-[130px]" />
      <div className="absolute top-[15%] right-[-10%] w-[50%] h-[800px] rounded-full bg-gradient-to-bl from-accent/[0.05] via-yellow-600/[0.02] to-transparent blur-[120px]" />
      <div className="absolute top-[40%] left-[15%] w-[65%] h-[900px] rounded-full bg-gradient-to-r from-accent-deep/[0.03] via-accent/[0.04] to-transparent blur-[140px]" />
      <div className="absolute bottom-0 right-[5%] w-[55%] h-[1000px] rounded-full bg-gradient-to-t from-accent/[0.09] via-accent/[0.03] to-transparent blur-[150px]" />

      {/* Cyber Grid Background */}
      <div 
        className="absolute inset-0 opacity-[0.025]" 
        style={{ 
          backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.15) 1px, transparent 1px)`,
          backgroundSize: "40px 40px"
        }} 
      />

      {/* Floating Particles */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1.5 h-1.5 bg-accent/20 rounded-full"
          initial={{ top: Math.random() * 100 + "%", left: Math.random() * 100 + "%" }}
          animate={{ y: [0, -100], opacity: [0, 1, 0] }}
          transition={{ duration: 10 + Math.random() * 5, repeat: Infinity, ease: "linear" }}
        />
      ))}

      {/* ========================================================================= */}
      {/* 2. ABSTRACT ORBITAL RINGS */}
      {/* ========================================================================= */}
      <motion.div 
        style={{ y: ySlow }}
        className="absolute top-[120px] left-1/2 -translate-x-1/2 w-[850px] h-[850px] opacity-[0.22] flex items-center justify-center pointer-events-none"
      >
        {/* Outermost ring: Gold dotted */}
        <div 
          className="absolute w-full h-full rounded-full border border-dashed border-accent/30 animate-spin"
          style={{ animationDuration: "140s" }}
        />
        {/* Middle ring: Glowing blue with nodes */}
        <div 
          className="absolute w-[80%] h-[80%] rounded-full border border-accent/20 animate-spin" 
          style={{ animationDuration: "90s", animationDirection: "reverse" }}
        >
          {/* Node pointers on the orbital path */}
          <div className="absolute -top-1.5 left-1/2 w-3 h-3 rounded-full bg-accent shadow-[0_0_12px_#3b82f6] border border-[#04060b]" />
          <div className="absolute -bottom-1.5 left-1/2 w-3 h-3 rounded-full bg-accent shadow-[0_0_12px_#6AA5FF] border border-[#04060b]" />
        </div>
        {/* Inner ring: double accent ring */}
        <div 
          className="absolute w-[60%] h-[60%] rounded-full border-2 border-double border-accent/15 animate-spin"
          style={{ animationDuration: "60s" }}
        />
        {/* Core ring: Subtle accent */}
        <div className="absolute w-[40%] h-[40%] rounded-full border border-accent/10 animate-pulse opacity-60" style={{ animationDuration: "5s" }} />
        <div className="absolute w-[40%] h-[40%] rounded-full border border-accent/10" />
      </motion.div>

      {/* Secondary Orbit Node at the Earn Section */}
      <motion.div 
        style={{ y: yMedium }}
        className="absolute top-[1600px] right-[-100px] w-[500px] h-[500px] opacity-[0.15] pointer-events-none"
      >
        <div className="w-full h-full rounded-full border border-accent/25 animate-spin" style={{ animationDuration: "80s" }}>
          <div className="absolute top-1/2 -translate-y-1/2 -left-1 w-2.5 h-2.5 rounded-full bg-accent shadow-[0_0_8px_rgb(59,130,246)]" />
        </div>
        <div className="absolute top-8 left-8 w-[calc(100%-64px)] h-[calc(100%-64px)] rounded-full border border-dashed border-accent/20 animate-spin" style={{ animationDuration: "40s", animationDirection: "reverse" }} />
      </motion.div>


      {/* ========================================================================= */}
      {/* 3. DIGITAL WORLD MAP (Tactical mesh mapped with coordinate lines) */}
      {/* ========================================================================= */}
      <motion.div 
        style={{ y: yMedium }}
        className="absolute top-[480px] inset-x-0 mx-auto max-w-7xl h-[420px] opacity-[0.14] flex justify-center items-center overflow-hidden"
      >
        <svg viewBox="0 0 1000 400" className="w-[110%] h-auto text-accent/40">
          {/* Dotted outlines representing digital continents */}
          {/* North America */}
          <path d="M100,80 L220,80 L280,120 L300,90 L270,60 L200,40 L120,40 Z" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="3 4" />
          {/* South America */}
          <path d="M250,180 L330,220 L290,340 L260,320 L240,240 Z" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="3 4" />
          {/* Eurasia */}
          <path d="M450,40 L650,30 L850,50 L880,110 L780,180 L720,130 L650,160 L500,100 Z" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
          {/* Africa */}
          <path d="M470,160 L580,160 L610,240 L560,310 L500,280 L460,200 Z" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="3 4" />
          {/* Australia */}
          <path d="M780,260 L850,260 L880,310 L810,330 L760,300 Z" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="3 4" />
          
          {/* 4. BLUE AND GOLD GLOWING TRANSACTION ROUTING PATHS */}
          <g className="text-accent-hover">
            {/* New York to London */}
            <path d="M 230,100 Q 350,60 520,70" fill="none" stroke="#FFD700" strokeWidth="1.5" strokeDasharray="500" strokeDashoffset="500" className="animate-[dash_12s_linear_infinite]" />
            <circle cx="230" cy="100" r="3" fill="#3b82f6" className="animate-pulse" />
            
            {/* London to Singapore */}
            <path d="M 520,70 Q 640,180 770,220" fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="500" strokeDashoffset="500" className="animate-[dash_15s_linear_infinite]" style={{ animationDelay: "3s" }} />
            <circle cx="520" cy="70" r="3.5" fill="#6AA5FF" className="animate-pulse" />
            <circle cx="770" cy="220" r="3" fill="#3b82f6" className="animate-pulse" />

            {/* Singapore to Tokyo */}
            <path d="M 770,220 Q 820,150 860,100" fill="none" stroke="#FFD700" strokeWidth="1" strokeDasharray="500" strokeDashoffset="500" className="animate-[dash_10s_linear_infinite]" style={{ animationDelay: "6s" }} />
            <circle cx="860" cy="100" r="3" fill="#6AA5FF" />
          </g>
        </svg>
      </motion.div>


      {/* ========================================================================= */}
      {/* 5. FLOATING CANDLESTICK CHARTS (Highly specific animated miniature plots) */}
      {/* ========================================================================= */}
      <motion.div style={{ y: yFast }} className="absolute inset-x-0 top-0 h-full w-full pointer-events-none">
        
        {/* Floating green candlestick cluster 1 */}
        <div className="absolute top-[280px] left-[6%] xl:left-[10%] opacity-[0.25] flex gap-1.5 items-end transform hover:scale-105 transition-transform duration-500">
          <div className="flex flex-col items-center">
            <div className="w-0.5 h-3 bg-positive" />
            <div className="w-3.5 h-10 bg-positive rounded-sm shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
            <div className="w-0.5 h-3 bg-positive" />
          </div>
          <div className="flex flex-col items-center">
            <div className="w-0.5 h-2 bg-positive" />
            <div className="w-3.5 h-14 bg-positive rounded-sm shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
            <div className="w-0.5 h-4 bg-positive" />
          </div>
          <div className="flex flex-col items-center">
            <div className="w-0.5 h-5 bg-negative" />
            <div className="w-3.5 h-6 bg-negative/90 rounded-sm" />
            <div className="w-0.5 h-2 bg-negative" />
          </div>
          <div className="flex flex-col items-center">
            <div className="w-0.5 h-2 bg-positive" />
            <div className="w-3.5 h-12 bg-positive rounded-sm shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
            <div className="w-0.5 h-2 bg-positive" />
          </div>
        </div>

        {/* Floating red candlestick cluster 2 */}
        <div className="absolute top-[820px] right-[8%] xl:right-[12%] opacity-[0.18] flex gap-1.5 items-end transform">
          <div className="flex flex-col items-center">
            <div className="w-0.5 h-4 bg-negative" />
            <div className="w-3 h-12 bg-negative rounded-sm" />
            <div className="w-0.5 h-2 bg-negative" />
          </div>
          <div className="flex flex-col items-center">
            <div className="w-0.5 h-5 bg-positive" />
            <div className="w-3 h-8 bg-positive rounded-sm shadow-[0_0_6px_rgba(16,185,129,0.2)]" />
            <div className="w-0.5 h-3 bg-positive" />
          </div>
          <div className="flex flex-col items-center">
            <div className="w-0.5 h-3 bg-negative" />
            <div className="w-3 h-16 bg-negative rounded-sm shadow-[0_0_10px_rgba(239,68,68,0.3)]" />
            <div className="w-0.5 h-4 bg-negative" />
          </div>
        </div>

        {/* Mini Gold breakout cluster 3 at bottom-ish levels */}
        <div className="absolute top-[1750px] left-[5%] opacity-[0.15] flex gap-1 text-2xs font-mono items-center">
          <div className="flex flex-col items-center">
            <div className="w-0.5 h-2 bg-accent-hover" />
            <div className="w-2.5 h-7 bg-accent-hover/90 rounded-sm shadow-[0_0_6px_rgba(106,165,255,0.3)]" />
            <div className="w-0.5 h-2 bg-accent-hover" />
          </div>
          <div className="flex flex-col items-center">
            <div className="w-0.5 h-1 bg-accent-hover" />
            <div className="w-2.5 h-10 bg-accent-hover/90 rounded-sm shadow-[0_0_8px_rgba(106,165,255,0.4)]" />
            <div className="w-0.5 h-3 bg-accent-hover" />
          </div>
          <span className="text-accent-hover/80 font-bold ml-1 animate-pulse">BREAKOUT</span>
        </div>
      </motion.div>


      {/* ========================================================================= */}
      {/* 6. FINANCIAL DATA STREAMS */}
      {/* ========================================================================= */}
      <motion.div 
        style={{ y: yMedium }}
        className="absolute inset-y-0 right-[4%] w-[80px] h-full opacity-[0.06] flex justify-between pointer-events-none text-2xs font-mono tracking-wider overflow-hidden pt-40"
      >
        {dataColumns.slice(0, 2).map((col, cIdx) => (
          <div key={cIdx} className="flex flex-col gap-6 select-none animate-[float_45s_linear_infinite]" style={{ animationDelay: `${cIdx * 5}s` }}>
            {col.map((item, iIdx) => (
              <span 
                key={iIdx} 
                className={`transform leading-none whitespace-nowrap ${
                  item.includes("▲") 
                    ? "text-positive" 
                    : item.includes("▼") 
                      ? "text-negative" 
                      : "text-faint"
                }`}
              >
                {item}
              </span>
            ))}
            {/* Repeat to guarantee infinite cycle */}
            {col.map((item, iIdx) => (
              <span 
                key={`r-${iIdx}`} 
                className={`transform leading-none whitespace-nowrap ${
                  item.includes("▲") 
                    ? "text-positive" 
                    : item.includes("▼") 
                      ? "text-negative" 
                      : "text-faint"
                }`}
              >
                {item}
              </span>
            ))}
          </div>
        ))}
      </motion.div>

      <motion.div 
        style={{ y: yFast }}
        className="absolute inset-y-0 left-[2%] w-[80px] h-full opacity-[0.05] flex justify-between pointer-events-none text-2xs font-mono tracking-wider overflow-hidden pt-80"
      >
        {dataColumns.slice(2, 4).map((col, cIdx) => (
          <div key={cIdx} className="flex flex-col gap-6 select-none animate-[float_60s_linear_infinite]" style={{ animationDelay: `${cIdx * 8}s`, animationDirection: "reverse" }}>
            {col.map((item, iIdx) => (
              <span 
                key={iIdx} 
                className={`transform leading-none whitespace-nowrap ${
                  item.includes("▲") 
                    ? "text-positive" 
                    : item.includes("▼") 
                      ? "text-negative" 
                      : "text-faint"
                }`}
              >
                {item}
              </span>
            ))}
          </div>
        ))}
      </motion.div>


      {/* ========================================================================= */}
      {/* 7. SUBTLE GLASSMORPHISM EFFECTS (Beautiful backdrop vectors in space) */}
      {/* ========================================================================= */}
      <motion.div style={{ y: ySlow }} className="absolute inset-x-0 mx-auto max-w-7xl h-full w-full pointer-events-none">
        
        {/* Floating backdrop polygon to catch lighting on top of grids */}
        <div className="absolute top-[180px] right-[4%] w-[220px] h-[340px] rounded-[32px] bg-gradient-to-b from-white/[0.015] to-transparent border border-white/[0.03]" />
        
        {/* Decorative thin gold vector line with bullet node */}
        <div className="absolute top-[520px] left-[3%] w-[150px] h-0.5 bg-gradient-to-r from-transparent via-accent/30 to-transparent">
          <div className="absolute left-1/2 -top-1 w-2 h-2 rounded-full bg-accent shadow-[0_0_8px_rgb(106,165,255)]" />
        </div>

        {/* Decorative thin blue vector line with bullet node on the right */}
        <div className="absolute top-[1140px] right-[2%] w-[180px] h-0.5 bg-gradient-to-l from-transparent via-accent/25 to-transparent">
          <div className="absolute left-1/3 -top-1 w-2 h-2 rounded-full bg-accent shadow-[0_0_8px_rgb(59,130,246)] animate-pulse" />
        </div>

        {/* Elegant structural support pillars with glass layer (highly detailed bottom section) */}
        <div className="absolute bottom-[10%] left-[8%] w-[160px] h-[320px] rounded-[24px] bg-gradient-to-tr from-white/[0.01] via-white/[0.02] to-transparent border border-white/[0.04]" />
      </motion.div>

      {/* Embedded core styles for seamless operation */}
      <style>{`
        @keyframes dash {
          to {
            stroke-dashoffset: 0;
          }
        }
        @keyframes float {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(-50%);
          }
        }
      `}</style>
    </div>
  );
};

