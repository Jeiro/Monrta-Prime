import React, { useState } from "react";
import { useSeo } from "../lib/useSeo";
import { useApp } from "../context/AppContext";
import { Search, TrendingUp, TrendingDown, ArrowRight, HelpCircle } from "lucide-react";

interface PublicMarketsProps {
  onNavigate: (view: string, targetAsset?: string) => void;
}

export const PublicMarkets: React.FC<PublicMarketsProps> = ({ onNavigate }) => {
  useSeo({
    title: "Live Crypto & Stock Markets — Real-Time Prices | Moneta Prime",
    description: "Track real-time cryptocurrency and stock prices, 24h changes, and volume on Moneta Prime. Live market data to inform every trade.",
    path: "/markets",
  });
  const { marketCrypto, marketStocks, isLoadingMarkets } = useApp();
  const [activeTab, setActiveTab] = useState<"crypto" | "stocks">("crypto");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<"symbol" | "price" | "change" | "volume">("volume");
  const [sortAsc, setSortAsc] = useState(false);

  const rawList = activeTab === "crypto" ? marketCrypto : marketStocks;
  
  // Filter and sort the assets List
  const processedList = rawList
    .filter(
      item =>
        item.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      let multiplier = sortAsc ? 1 : -1;
      if (sortField === "symbol") return a.symbol.localeCompare(b.symbol) * multiplier;
      if (sortField === "price") return (a.price - b.price) * multiplier;
      if (sortField === "change") return (a.change - b.change) * multiplier;
      
      // Volume parsing
      const getVal = (vol: string) => {
        const parsed = parseFloat(vol);
        if (vol.endsWith("B")) return parsed * 1e9;
        if (vol.endsWith("M")) return parsed * 1e6;
        return parsed;
      };
      return (getVal(a.volume) - getVal(b.volume)) * multiplier;
    });

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 pb-20">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-line/50 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-ink flex items-center gap-3">
            <TrendingUp size={28} className="text-accent" />
            Markets
          </h1>
          <p className="text-xs text-muted mt-1 font-sans">
            Real-time asset prices. Select any trading pair to view live charts and trade instantly.
          </p>
        </div>

        {/* Search bar */}
        <div className="relative w-full md:w-80">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Search assets (e.g. BTC, NVDA)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface border border-line rounded-xl pl-10 pr-4 py-2 text-xs focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/15 text-ink font-sans"
          />
        </div>
      </div>

      {/* Primary tab selectors */}
      <div className="flex rounded-xl p-1.5 w-fit bg-transparent border-none">
        <button
          onClick={() => { setActiveTab("crypto"); setSearchQuery(""); }}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-bold font-subheading transition-all cursor-pointer ${
            activeTab === "crypto" ? "bg-accent text-ground" : "text-muted hover:text-ink"
          }`}
        >
          🪙 Cryptocurrencies
        </button>
        <button
          onClick={() => { setActiveTab("stocks"); setSearchQuery(""); }}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-bold font-subheading transition-all cursor-pointer ${
            activeTab === "stocks" ? "bg-accent text-ground" : "text-muted hover:text-ink"
          }`}
        >
          📈 Equity Stocks NASDAQ
        </button>
      </div>

      {/* Main Markets List Table */}
      <div className="bg-transparent border-none rounded-xl overflow-hidden shadow-none">
        {isLoadingMarkets ? (
          <div className="p-16 text-center text-muted space-y-3 font-sans">
            <span className="animate-spin inline-block w-6 h-6 border-2 border-accent border-t-transparent rounded-full" />
            <p className="text-xs">Connecting securely to real-time Polygon proxy pools...</p>
          </div>
        ) : processedList.length === 0 ? (
          <div className="p-16 text-center text-muted font-sans">
            <HelpCircle className="mx-auto mb-2 text-muted/55" size={32} />
            <p className="text-xs">No assets match your search parameters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left border-collapse">
              <thead>
                <tr className="border-b border-line text-2xs uppercase font-subheading tracking-wider text-muted bg-panel/40">
                  <th 
                    onClick={() => handleSort("symbol")}
                    className="p-4 pl-6 cursor-pointer hover:text-ink transition-colors"
                  >
                    Asset Symbol {sortField === "symbol" ? (sortAsc ? "▲" : "▼") : ""}
                  </th>
                  <th className="p-4">Name</th>
                  <th 
                    onClick={() => handleSort("price")}
                    className="p-4 cursor-pointer hover:text-ink transition-colors"
                  >
                    Last Price {sortField === "price" ? (sortAsc ? "▲" : "▼") : ""}
                  </th>
                  <th 
                    onClick={() => handleSort("change")}
                    className="p-4 cursor-pointer hover:text-ink transition-colors"
                  >
                    24h Change {sortField === "change" ? (sortAsc ? "▲" : "▼") : ""}
                  </th>
                  <th className="p-4 hidden sm:table-cell">24h High / Low</th>
                  <th 
                    onClick={() => handleSort("volume")}
                    className="p-4 cursor-pointer hover:text-ink transition-colors hidden md:table-cell"
                  >
                    Adjusted Volume {sortField === "volume" ? (sortAsc ? "▲" : "▼") : ""}
                  </th>
                  <th className="p-4 text-center font-subheading">Trend (7d)</th>
                  <th className="p-4 pr-6 text-right font-subheading">Execute</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/30">
                {processedList.map((asset) => {
                  const symbolClean = asset.symbol.split("/")[0];
                  return (
                    <tr 
                      key={asset.symbol}
                      onClick={() => onNavigate("dashboard-trading", asset.symbol)}
                      className="hover:bg-panel/50 transition-colors cursor-pointer group text-xs text-ink"
                    >
                      {/* Symbol */}
                      <td className="p-4 pl-6 font-data font-bold text-ink group-hover:text-accent transition-colors">
                        {asset.symbol}
                      </td>
                      
                      {/* Name */}
                      <td className="p-4 text-muted font-sans">
                        {asset.name}
                      </td>
 
                      {/* Price */}
                      <td className="p-4 font-data font-semibold text-ink">
                        ${asset.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
 
                      {/* Change */}
                      <td className={`p-4 font-data font-semibold ${
                        asset.change >= 0 ? "text-positive" : "text-negative"
                      }`}>
                        <div className="flex items-center gap-1">
                          {asset.change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                          {asset.change >= 0 ? "+" : ""}{asset.change}%
                        </div>
                      </td>
 
                      {/* High / Low */}
                      <td className="p-4 font-data text-muted hidden sm:table-cell">
                        ${asset.high.toLocaleString(undefined, { minimumFractionDigits: 2 })} / 
                        <span className="ml-1">${asset.low.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </td>
 
                      {/* Volume */}
                      <td className="p-4 font-data text-muted hidden md:table-cell">
                        {asset.volume}
                      </td>
 
                      {/* Sparkline mini chart */}
                      <td className="p-4">
                        <div className="w-24 h-8 mx-auto shrink-0">
                          <svg className="w-full h-full" viewBox="0 0 100 30">
                            <polyline
                              fill="none"
                              stroke={asset.change >= 0 ? "var(--color-positive)" : "var(--color-negative)"}
                              strokeWidth="1.5"
                              points={asset.sparkline.map((val, idx) => {
                                const min = Math.min(...asset.sparkline);
                                const max = Math.max(...asset.sparkline);
                                const range = max - min || 1;
                                const x = (idx / (asset.sparkline.length - 1)) * 100;
                                const y = 30 - ((val - min) / range) * 23 - 3;
                                return `${x},${y}`;
                              }).join(" ")}
                            />
                          </svg>
                        </div>
                      </td>
 
                      {/* CTA link */}
                      <td className="p-4 pr-6 text-right font-subheading">
                        <span className="inline-flex items-center gap-1 text-2xs font-bold font-subheading text-accent group-hover:text-ink transition-colors bg-accent/15 px-2.5 py-1 rounded">
                          TRADE
                          <ArrowRight size={10} className="transform group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="p-6 rounded-xl text-xs text-muted flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-sans bg-transparent border-none shadow-none">
        <div>
          <strong className="font-subheading">Market Notice:</strong> <span className="lowercase text-ink font-medium">moneta <span className="text-accent">prime</span></span> order books aggregate deep global liquidity for premium stability. All orders execute with ultra-low latency.
        </div>
        <button 
          onClick={() => onNavigate("dashboard-trading")}
          className="px-5 py-2 rounded-lg text-accent hover:text-ink text-2xs font-medium font-subheading transition-all shrink-0 cursor-pointer"
        >
          Go to Trading Terminal
        </button>
      </div>

    </div>
  );
};
