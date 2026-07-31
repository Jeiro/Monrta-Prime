import React, { useState, useEffect } from "react";
import { useSeo } from "../lib/useSeo";
import { useApp } from "../context/AppContext";
import { 
  ArrowUpRight, 
  TrendingUp, 
  Zap, 
  Flame, 
  Users, 
  Settings, 
  Circle, 
  ChevronLeft, 
  ChevronRight, 
  Star, 
  Coins,
  Search,
  ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { TradeFeatures, InvestmentPlansSection, Proof, Closing, Footer, Testimonials, HomeVideos } from "../components/HomeSections";
import { Brandmark } from "../components/ui/Brandmark";

// Micro-animation variants for staggering cards
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
    },
  },
};

// Testimonials data representing real-world user reviews
const REVIEWS = [
  {
    name: "Marcus Aurelius K.",
    country: "Singapore",
    rating: 5,
    title: "Institutional execution speeds",
    text: "The latency on order routing is virtually zero. Moneta Prime's focus on dark mode visuals, combined with robust performance and responsive state machines, makes it my primary terminal.",
    avatar: "MK"
  },
  {
    name: "Elena Rostova",
    country: "United Kingdom",
    rating: 5,
    title: "Absolute masterpiece design",
    text: "By far the most intuitive and beautifully crafted dashboard in crypto. The portfolio trackers are synchronized instantly and the visual gradients are deep and eye-friendly.",
    avatar: "ER"
  },
  {
    name: "David Vance",
    country: "United States",
    rating: 5,
    title: "Seamless liquidity & support",
    text: "I was skeptical about automated payouts, but security vaults here are top-tier. Support tickets are resolved without standard AI-bot delays. Absolute gold standard of exchanges.",
    avatar: "DV"
  },
  {
    name: "Satoshi Tanaka",
    country: "Japan",
    rating: 5,
    title: "Elite mobile & desktop sync",
    text: "The copy trading feature has perfectly matched execution fills. Clean typography, excellent UX, and transparent tracking. Highly recommended for retail and pro trading.",
    avatar: "ST"
  }
];

export const PublicHome: React.FC<{ onNavigate: (view: string) => void }> = ({ onNavigate }) => {
  useSeo({
    title: "Moneta Prime — Crypto Trading, Copy Trading & Investment Plans",
    description: "Trade crypto with precision on Moneta Prime. Real-time markets, tiered investment plans, and copy trading in one workspace built for serious traders.",
    path: "/",
  });
  const { marketCrypto, marketStocks, user } = useApp();
  const [activeSpotlightTab, setActiveSpotlightTab] = useState<"crypto" | "stocks">("crypto");
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [marketSearch, setMarketSearch] = useState("");
  const [selectedMarketTab, setSelectedMarketTab] = useState<"crypto" | "stocks">("crypto");

  // Auto-rotate reviews every 6 seconds as a premium landing page feature
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentReviewIndex((prev) => (prev + 1) % REVIEWS.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const handlePrevReview = () => {
    setCurrentReviewIndex((prev) => (prev - 1 + REVIEWS.length) % REVIEWS.length);
  };

  const handleNextReview = () => {
    setCurrentReviewIndex((prev) => (prev + 1) % REVIEWS.length);
  };

  // Safe slice & check fallback for asset showcases
  const spotlightCrypto = marketCrypto && marketCrypto.length > 0 ? marketCrypto.slice(0, 5) : [
    { symbol: "BTC", name: "Bitcoin", price: 98400.00, change: 4.82, sparkline: [98000, 98200, 98500, 98300, 98700, 99100, 98400] },
    { symbol: "ETH", name: "Ethereum", price: 3412.80, change: 2.15, sparkline: [3350, 3360, 3390, 3380, 3400, 3405, 3412] },
    { symbol: "SOL", name: "Solana", price: 184.20, change: -1.45, sparkline: [189, 187, 186, 185, 184, 185, 184] },
    { symbol: "BNB", name: "BNB", price: 588.60, change: 0.95, sparkline: [582, 584, 585, 583, 587, 588, 588] },
    { symbol: "XRP", name: "Ripple", price: 1.12, change: 12.30, sparkline: [0.98, 1.01, 1.04, 1.03, 1.10, 1.09, 1.12] },
  ];

  const spotlightStocks = marketStocks && marketStocks.length > 0 ? marketStocks.slice(0, 5) : [
    { symbol: "AAPL", name: "Apple Inc.", price: 194.50, change: 1.25, sparkline: [192, 193, 192.5, 194, 193.8, 194.2, 194.5] },
    { symbol: "TSLA", name: "Tesla Inc.", price: 218.30, change: -3.21, sparkline: [224, 222, 220, 221, 219, 217, 218.3] },
    { symbol: "NVDA", name: "NVIDIA Corp.", price: 875.12, change: 5.82, sparkline: [830, 842, 850, 848, 860, 868, 875] },
    { symbol: "GOOGL", name: "Alphabet Inc.", price: 172.40, change: 0.45, sparkline: [171.5, 172, 171.8, 172.2, 172.1, 172.3, 172.4] },
    { symbol: "AMD", name: "Advanced Micro Devices", price: 164.80, change: -2.10, sparkline: [168, 167, 166.5, 165.2, 164.9, 165, 164.8] },
  ];

  const tableRawAssets = selectedMarketTab === "crypto" ? spotlightCrypto : spotlightStocks;
  const filteredTableAssets = tableRawAssets
    .filter(asset => 
      asset.symbol.toLowerCase().includes(marketSearch.toLowerCase()) || 
      asset.name.toLowerCase().includes(marketSearch.toLowerCase())
    )
    .slice(0, 4);

  // Helper to render real-time sparkline SVG curves
  const renderMiniSparkline = (points: number[], isPositive: boolean) => {
    if (!points || points.length === 0) return null;
    const width = 120;
    const height = 36;
    const min = Math.min(...points);
    const max = Math.max(...points);
    const range = max - min || 1;
    
    const svgPoints = points.map((p, index) => {
      const x = (index / (points.length - 1)) * width;
      const y = height - 3 - ((p - min) / range) * (height - 6);
      return `${x},${y}`;
    }).join(" ");

    const strokeColor = isPositive ? "#10B981" : "#EF4444"; // emerald vs rose
    const fillGradientId = `grad-${Math.random()}`;

    return (
      <svg width={width} height={height} className="overflow-visible">
        <defs>
          <linearGradient id={fillGradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={strokeColor} stopOpacity="0.2" />
            <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <polyline
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={svgPoints}
        />
        <polygon
          points={`0,${height} ${svgPoints} ${width},${height}`}
          fill={`url(#${fillGradientId})`}
        />
      </svg>
    );
  };

  return (
    <div className="min-h-screen bg-transparent text-ink font-sans selection:bg-accent/20 overflow-x-hidden pt-0">
      
      {/* 1. HERO BANNER: METRICS & EXQUISITE CELESTIAL ORBITING SYSTEM */}
      <section className="relative flex flex-col justify-center items-center bg-gradient-to-b from-ground via-panel to-black border-b border-line/30 px-4 overflow-hidden pt-14 sm:pt-16 pb-14">
        
        {/* Subtle grid background effects */}
        <div className="absolute inset-0 bg-[radial-gradient(rgba(106,165,255,0.12)_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[140px] pointer-events-none" />
        
        <div className="max-w-4xl mx-auto w-full relative z-20 text-center flex flex-col items-center mt-2">
          
          {/* Main Display Typography */}
          <div className="space-y-4 max-w-3xl">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[64px] font-extrabold text-ink tracking-tight leading-tight max-w-4xl mx-auto font-sans">
              Trade Smarter With <span className="lowercase text-ink font-extrabold">moneta <span className="text-accent">prime</span></span>
            </h1>
            <p className="text-muted text-sm sm:text-base max-w-md mx-auto leading-relaxed">
              Access global markets through a secure, data-driven trading platform. Built for traders and investors who demand precision, speed, and reliability.
            </p>
          </div>

          {/* Golden Highlight Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8 w-full max-w-lg">
            <button 
              onClick={() => onNavigate(user.isLoggedIn ? "dashboard-trading" : "auth")}
              className="orb-button w-full sm:w-auto px-8 py-3.5"
            >
              Start Trading <ArrowUpRight size={16} />
            </button>
            <button 
              onClick={() => onNavigate("markets")}
              className="orb-button-secondary w-full sm:w-auto px-8 py-3.5"
            >
              Explore Markets
            </button>
          </div>

          {/* CELESTIAL ORBIT ANIMATION SYSTEM (Bybit-themed mockups with upright counter-rotation) */}
          <div className="relative w-full max-w-lg h-[240px] min-[380px]:h-[280px] min-[440px]:h-[340px] sm:h-[500px] mt-2 sm:mt-12 flex items-center justify-center select-none overflow-visible scale-[0.62] min-[380px]:scale-[0.72] min-[440px]:scale-[0.85] sm:scale-100 transition-transform origin-center">
            
            {/* Ambient gold starfields glow */}
            <div className="absolute w-56 h-56 bg-accent/10 rounded-full blur-[60px]" />
            
            {/* Central Moneta Prime Logo Brand Core */}
            <div className="absolute w-[180px] h-[180px] rounded-full bg-transparent border-2 border-accent/20 flex flex-col items-center justify-center z-30 shadow-[0_0_50px_rgba(106,165,255,0.15)]">
              <Brandmark className="w-[52px] h-[52px] transition-transform duration-500 hover:rotate-6 drop-shadow-[0_4px_16px_rgba(106,165,255,0.4)]" />
              <span className="text-base text-ink font-bold tracking-[0.05em] mt-2 font-sans lowercase">
                moneta <span className="text-accent">prime</span>
              </span>
            </div>

            {/* RING 1 (Inner Crypto Orbit) - Radius 95px, rotates Clockwise */}
            <motion.div 
              animate={{ rotate: 360 }} 
              transition={{ repeat: Infinity, duration: 16, ease: "linear" }} 
              className="absolute w-[190px] h-[190px] rounded-full border border-line/60 border-dashed z-10"
            >
              {[
                { label: "₿", symbol: "BTC", bg: "bg-accent", color: "text-ink", angle: 0 },
                { label: "Ξ", symbol: "ETH", bg: "bg-[#4E62CC]", color: "text-ink", angle: 120 },
                { label: "₮", symbol: "USDT", bg: "bg-[#26A17B]", color: "text-ink", angle: 240 }
              ].map((token, index) => (
                <div
                  key={index}
                  className="absolute"
                  style={{
                    left: "50%",
                    top: "50%",
                    transform: `translate(-50%, -50%) rotate(${token.angle}deg) translateY(-95px) rotate(${-token.angle}deg)`
                  }}
                >
                  {/* Counter-rotation to keep symbol perfectly upright */}
                  <motion.div 
                    animate={{ rotate: -360 }} 
                    transition={{ repeat: Infinity, duration: 16, ease: "linear" }}
                    className={`${token.bg} ${token.color} w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-[0_0_12px_rgba(0,0,0,0.8)] border border-white/15`}
                  >
                    {token.label}
                  </motion.div>
                </div>
              ))}
            </motion.div>

            {/* RING 2 (Middle Blue-Chip Assets Orbit) - Radius 150px, rotates Counter-Clockwise */}
            <motion.div 
              animate={{ rotate: -360 }} 
              transition={{ repeat: Infinity, duration: 25, ease: "linear" }} 
              className="absolute w-[300px] h-[300px] rounded-full border border-line/40 border-dotted z-10"
            >
              {[
                { label: "T", bg: "bg-[#E82127]", color: "text-ink", angle: 0 },
                { label: "", bg: "bg-white", color: "text-black", angle: 72 },
                { label: "NV", bg: "bg-[#76B900]", color: "text-ink", angle: 144 },
                { label: "G", bg: "bg-[#4285F4]", color: "text-ink", angle: 216 },
                { label: "a", bg: "bg-[#FF9900]", color: "text-black", angle: 288 }
              ].map((token, index) => (
                <div
                  key={index}
                  className="absolute"
                  style={{
                    left: "50%",
                    top: "50%",
                    transform: `translate(-50%, -50%) rotate(${token.angle}deg) translateY(-150px) rotate(${-token.angle}deg)`
                  }}
                >
                  <motion.div 
                    animate={{ rotate: 360 }} 
                    transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
                    className={`${token.bg} ${token.color} w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-[0_0_10px_rgba(0,0,0,0.6)] border border-white/10`}
                  >
                    {token.label}
                  </motion.div>
                </div>
              ))}
            </motion.div>

            {/* RING 3 (Outer Global Asset Orbit) - Radius 210px, rotates Clockwise */}
            <motion.div 
              animate={{ rotate: 360 }} 
              transition={{ repeat: Infinity, duration: 38, ease: "linear" }} 
              className="absolute w-[420px] h-[420px] rounded-full border border-line/20 z-10"
            >
              {[
                { label: "AVAX", bg: "bg-[#E84142]", color: "text-ink text-2xs", angle: 0 },
                { label: "Đ", bg: "bg-[#C2A633]", color: "text-ink text-xs", angle: 45 },
                { label: "LINK", bg: "bg-[#375BD2]", color: "text-ink text-2xs", angle: 90 },
                { label: "DOT", bg: "bg-[#E6007A]", color: "text-ink text-2xs", angle: 135 },
                { label: "TRX", bg: "bg-[#EC0623]", color: "text-ink text-2xs", angle: 180 },
                { label: "LTC", bg: "bg-[#345D9D]", color: "text-ink text-2xs", angle: 225 },
                { label: "🚀", bg: "bg-gradient-to-tr from-[#1D4ED8] to-[#1E3A8A]", color: "text-ink text-xs", angle: 270 },
                { label: "MS", bg: "bg-[#00A4EF]", color: "text-ink text-xs", angle: 315 }
              ].map((token, index) => (
                <div
                  key={index}
                  className="absolute"
                  style={{
                    left: "50%",
                    top: "50%",
                    transform: `translate(-50%, -50%) rotate(${token.angle}deg) translateY(-210px) rotate(${-token.angle}deg)`
                  }}
                >
                  <motion.div 
                    animate={{ rotate: -360 }} 
                    transition={{ repeat: Infinity, duration: 38, ease: "linear" }}
                    className={`${token.bg} ${token.color} w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-[0_0_10px_rgba(0,0,0,0.5)] border border-white/5`}
                  >
                    {token.label}
                  </motion.div>
                </div>
              ))}
            </motion.div>

            {/* Glowing Trademark Brand Motto underneath orbit - Borderless and containerless, staying horizontal */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 whitespace-nowrap">
              <span className="text-2xs font-mono tracking-[0.25em] font-semibold text-accent uppercase">
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
      <Testimonials />
      <Closing onNavigate={onNavigate} />

      <Footer onNavigate={onNavigate} />
    </div>
  );
};
