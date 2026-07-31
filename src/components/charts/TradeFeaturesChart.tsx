import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import {
  Settings, HelpCircle, ChevronDown, Plus, TrendingUp, Sparkles, Activity, BarChart3, Layers
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Bar, ComposedChart
} from 'recharts';
import { SUPPORTED_COINS, CoinInfo } from '../../lib/constants';

interface TradeFeaturesChartProps {
  onNavigate?: (view: string) => void;
}

const generateMockData = (basePrice: number) => {
  const data = [];
  let currentPrice = basePrice * 0.9;
  for (let i = 0; i < 30; i++) {
    const change = (Math.random() - 0.45) * (basePrice * 0.05);
    currentPrice += change;
    data.push({
      time: `Day ${i + 1}`,
      price: currentPrice,
      volume: Math.random() * 10000 + 5000,
    });
  }
  // Ensure the last price is exactly the basePrice
  data[data.length - 1].price = basePrice;
  return data;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#121318]/90 backdrop-blur-md border border-[#2B3139] p-3 rounded-xl shadow-2xl">
        <p className="text-muted text-xs mb-1 font-mono">{label}</p>
        <p className="text-accent font-bold font-mono">
          Price: ${payload[0].value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        {payload[1] && (
          <p className="text-slate-400 text-xs mt-1">
            Vol: {Math.round(payload[1].value).toLocaleString()}
          </p>
        )}
      </div>
    );
  }
  return null;
};

export const TradeFeaturesChart: React.FC<TradeFeaturesChartProps> = ({ onNavigate }) => {
  const [selectedCoin, setSelectedCoin] = useState<CoinInfo>(SUPPORTED_COINS[0]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [timeframe, setTimeframe] = useState<"1m" | "30m" | "1h" | "D">("D");
  const [chartData, setChartData] = useState(generateMockData(SUPPORTED_COINS[0].basePrice));
  const [realtimePrice, setRealtimePrice] = useState(SUPPORTED_COINS[0].basePrice);
  const [priceChangePercent, setPriceChangePercent] = useState(1.66);
  const [priceChangeAbs, setPriceChangeAbs] = useState(1052.04);
  const [chartType, setChartType] = useState<"area" | "line">("area");
  const [showVolume, setShowVolume] = useState(true);
  const [hasChartSize, setHasChartSize] = useState(false);
  const [isOnScreen, setIsOnScreen] = useState(false);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);

  // Pause the simulated tick while the section is scrolled out of view —
  // otherwise the landing page re-renders this whole section every 2s
  // even when the chart isn't visible.
  useEffect(() => {
    const node = sectionRef.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setIsOnScreen(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => setIsOnScreen(entry.isIntersecting),
      { rootMargin: "100px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const node = chartContainerRef.current;
    if (!node) return;

    const updateSize = () => {
      setHasChartSize(node.clientWidth > 0 && node.clientHeight > 0);
    };

    const rafId = window.requestAnimationFrame(updateSize);
    const resizeObserver = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => window.requestAnimationFrame(updateSize)) : null;

    if (resizeObserver) {
      resizeObserver.observe(node);
    } else {
      const timeoutId = window.setTimeout(updateSize, 50);
      window.addEventListener("resize", updateSize);
      return () => {
        window.clearTimeout(timeoutId);
        window.removeEventListener("resize", updateSize);
        window.cancelAnimationFrame(rafId);
      };
    }

    return () => {
      resizeObserver?.disconnect();
      window.cancelAnimationFrame(rafId);
    };
  }, []);

  // Update data when coin changes
  useEffect(() => {
    const data = generateMockData(selectedCoin.basePrice);
    setChartData(data);
    setRealtimePrice(selectedCoin.basePrice);
    setPriceChangeAbs(selectedCoin.basePrice * 0.0166);
    setPriceChangePercent(1.66);
  }, [selectedCoin, timeframe]);

  // Simulate live price ticks (only while visible)
  useEffect(() => {
    if (!isOnScreen) return;
    const timer = setInterval(() => {
      if (document.hidden) return;
      const volatility = selectedCoin.basePrice * 0.0002;
      const change = (Math.random() - 0.46) * volatility;
      setRealtimePrice(prev => {
        const nextPrice = Number((prev + change).toFixed(selectedCoin.basePrice < 10 ? 4 : 2));
        const diff = Number((nextPrice - (selectedCoin.basePrice * 0.9834)).toFixed(selectedCoin.basePrice < 10 ? 4 : 2));
        const pct = Number(((diff / (selectedCoin.basePrice * 0.9834)) * 100).toFixed(2));
        setPriceChangeAbs(diff);
        setPriceChangePercent(pct);
        
        // Update the last data point
        setChartData(currentData => {
          const newData = [...currentData];
          newData[newData.length - 1] = { ...newData[newData.length - 1], price: nextPrice };
          return newData;
        });

        return nextPrice;
      });
    }, 2000);
    return () => clearInterval(timer);
  }, [selectedCoin, isOnScreen]);

  const minPrice = Math.min(...chartData.map(d => d.price));
  const maxPrice = Math.max(...chartData.map(d => d.price));
  const yDomain = [minPrice * 0.99, maxPrice * 1.01];

  return (
    <div ref={sectionRef} className="w-full bg-[#0B0E11] border-y border-[#2B3139]/50 py-16 lg:py-24 relative z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-4 md:max-w-2xl text-center md:text-left mx-auto md:mx-0">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-accent/10 border border-accent/30 text-accent mb-2">
              <Layers size={24} />
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight font-sans">
              The Benchmark for Secure<br className="hidden sm:block" />
              Multi-Asset Investing
            </h2>
            <p className="text-slate-400 text-sm md:text-base max-w-xl leading-relaxed mx-auto md:mx-0">
              Join a network of over 6,000 elite investors who rely on Moneta Prime to automate their growth. Sync your portfolio with top-tier strategists and experience institutional-grade execution in real time.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => onNavigate && onNavigate("dashboard-trading")}
              className="px-6 py-3 bg-accent hover:bg-[#8ABAFF] text-black font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(106,165,255,0.15)] flex items-center gap-2 text-sm"
            >
              Start Trading <TrendingUp size={16} />
            </button>
          </div>
        </div>

        {/* The Interactive Terminal UI */}
        <div className="bg-[#12161A] border border-[#2B3139] rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/5">
          {/* Terminal Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 border-b border-[#2B3139]/80 bg-[#0F1216]">
            
            {/* Coin Selector */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-3 px-4 py-2 bg-[#1A1F26] hover:bg-[#252A33] border border-[#2B3139] rounded-lg transition-colors"
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${selectedCoin.iconBg}`}>
                  {selectedCoin.icon}
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-white font-bold text-sm leading-none">{selectedCoin.symbol}/USD</span>
                </div>
                <ChevronDown size={14} className="text-slate-400" />
              </button>

              {dropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-[#1A1F26] border border-[#2B3139] rounded-xl shadow-xl z-50 overflow-hidden">
                  {SUPPORTED_COINS.map(coin => (
                    <button
                      key={coin.symbol}
                      onClick={() => { setSelectedCoin(coin); setDropdownOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#252A33] transition-colors border-b border-[#2B3139]/50 last:border-0"
                    >
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${coin.iconBg}`}>
                        {coin.icon}
                      </div>
                      <div className="flex flex-col items-start">
                        <span className="text-white font-bold text-sm">{coin.symbol}/USD</span>
                        <span className="text-slate-400 text-xs">{coin.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Price Ticker */}
            <div className="flex items-center gap-6">
              <div className="flex flex-col">
                <motion.span 
                  key={realtimePrice}
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`text-xl font-bold font-mono ${priceChangePercent >= 0 ? "text-emerald-400" : "text-rose-400"}`}
                >
                  {realtimePrice.toLocaleString(undefined, { minimumFractionDigits: selectedCoin.basePrice < 10 ? 4 : 2 })}
                </motion.span>
                <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">Current Price</span>
              </div>
              <div className="flex flex-col">
                <span className={`text-sm font-bold font-mono ${priceChangePercent >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {priceChangePercent >= 0 ? "+" : ""}{priceChangeAbs} ({priceChangePercent}%)
                </span>
                <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">24h Change</span>
              </div>
            </div>

            {/* Toolbar Actions */}
            <div className="flex items-center gap-2">
              <div className="flex bg-[#1A1F26] rounded-lg p-1 border border-[#2B3139]">
                {(["1m", "30m", "1h", "D"] as const).map(tf => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                      timeframe === tf ? "bg-[#2B3139] text-white" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
              
              <button 
                onClick={() => setChartType(prev => prev === "area" ? "line" : "area")}
                className="p-2 bg-[#1A1F26] hover:bg-[#252A33] border border-[#2B3139] rounded-lg text-slate-400 hover:text-white transition-colors"
                title="Toggle Chart Type"
              >
                <Activity size={16} />
              </button>
              
              <button 
                onClick={() => setShowVolume(!showVolume)}
                className={`p-2 border rounded-lg transition-colors ${showVolume ? "bg-accent/10 border-accent/30 text-accent" : "bg-[#1A1F26] border-[#2B3139] text-slate-400 hover:text-white"}`}
                title="Toggle Volume"
              >
                <BarChart3 size={16} />
              </button>
            </div>

          </div>

          {/* Interactive Recharts Area */}
          <div ref={chartContainerRef} className="p-4 h-[400px] w-full">
            {hasChartSize ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={priceChangePercent >= 0 ? "#10B981" : "#F43F5E"} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={priceChangePercent >= 0 ? "#10B981" : "#F43F5E"} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2B3139" vertical={false} />
                  <XAxis dataKey="time" stroke="#848E9C" fontSize={10} tickMargin={10} minTickGap={30} />
                  <YAxis 
                    domain={yDomain} 
                    stroke="#848E9C" 
                    fontSize={10} 
                    tickFormatter={(value) => `$${value.toLocaleString()}`}
                    orientation="right"
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#475569', strokeWidth: 1, strokeDasharray: '4 4' }} />
                  <Area 
                    type="monotone" 
                    dataKey="price" 
                    stroke={priceChangePercent >= 0 ? "#10B981" : "#F43F5E"} 
                    strokeWidth={2}
                    fillOpacity={chartType === "area" ? 1 : 0} 
                    fill={chartType === "area" ? "url(#colorPrice)" : "transparent"} 
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : null}
          </div>
          
          {/* Volume Chart (Optional) */}
          {showVolume && hasChartSize && (
            <div className="px-4 pb-4 h-[80px] w-full mt-[-20px]">
              <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                <ComposedChart data={chartData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                  <YAxis hide />
                  <Bar dataKey="volume" fill="#2B3139" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
