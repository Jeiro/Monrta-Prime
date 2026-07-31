import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { TradingViewWidget } from "../components/TradingViewWidget";
import { TrendingUp, TrendingDown, DollarSign, RefreshCw, Layers, ShieldCheck, ShieldAlert, ChevronDown, Activity, Eye, EyeOff, BarChart2 } from "lucide-react";

interface DashboardTradingProps {
  initialAsset?: string;
  onNavigate: (view: string) => void;
}

export const DashboardTrading: React.FC<DashboardTradingProps> = ({ initialAsset, onNavigate }) => {
  const { marketCrypto, marketStocks, user, deposit, executeTrade, setInsufficientBalanceOpen } = useApp();
  const [selectedAssetSymbol, setSelectedAssetSymbol] = useState(initialAsset || "BTC/USD");
  const [showBalance, setShowBalance] = useState(true);

  const fullMarketList = [...marketCrypto, ...marketStocks];
  const activeAsset = fullMarketList.find(a => a.symbol === selectedAssetSymbol) || marketCrypto[0] || {
    symbol: "BTC/USD", name: "Bitcoin", price: 98400.00, change: 2.45, high: 99200, low: 97100, volume: "24.1B"
  };

  // Buy/Sell form parameters
  const [tradeType, setTradeType] = useState<"buy" | "sell">("buy");
  const [orderType, setOrderType] = useState<"market" | "limit">("market");
  const [amountInputTxt, setAmountInputTxt] = useState("");
  const [priceInput, setPriceInput] = useState(activeAsset.price.toString());
  const [leverage, setLeverage] = useState(1); // 1x to 50x multiplier list

  // Execution notification logs
  const [log, setLog] = useState<string | null>(null);

  useEffect(() => {
    setPriceInput(activeAsset.price.toString());
  }, [selectedAssetSymbol]); // Intentional: Only reset price input when switching assets, not on every market tick

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLog(null);

    if (!user.isLoggedIn) {
      onNavigate("auth");
      return;
    }

    const amountValue = parseFloat(amountInputTxt);
    if (!amountValue || amountValue <= 0) {
      triggerLog("Error: Invalid capital amount specified.");
      return;
    }

    const orderPrice = orderType === "market" ? activeAsset.price : parseFloat(priceInput);
    if (!orderPrice || orderPrice <= 0) {
      triggerLog("Error: Invalid execution trigger rate.");
      return;
    }

    const result = await executeTrade(
      selectedAssetSymbol,
      activeAsset.name,
      tradeType,
      amountValue,
      orderPrice,
      selectedAssetSymbol.includes("/")
    );

    if (result.success) {
      setAmountInputTxt("");
      triggerLog(result.message);
    } else {
      if (result.message === "INSUFFICIENT_BALANCE") {
        setInsufficientBalanceOpen(true);
      } else {
        triggerLog(`Error: ${result.message}`);
      }
    }
  };

  const triggerLog = (msg: string) => {
    setLog(msg);
    setTimeout(() => setLog(null), 6000);
  };

  return (
    <div className="space-y-4 pb-4 sm:pb-6">
      
      {/* 1. Mini top stats banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 py-3.5 px-5 sm:px-6 rounded-xl border border-line bg-surface text-xs font-sans">
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <div>
            <span className="text-2xs text-muted select-none font-subheading">Active Trading Pair</span>
            <div className="mt-1">
              <button
                type="button"
                className="text-xs text-ink font-bold leading-none font-data flex items-center gap-1.5 hover:text-accent hover:bg-accent/5 px-2 py-1 rounded border border-line/50 hover:border-accent/50 transition-all cursor-pointer focus:outline-none"
                onClick={() => {
                  const el = document.querySelector(".lg\\:col-span-3");
                  if (el) {
                    el.scrollIntoView({ behavior: "smooth" });
                  }
                }}
              >
                {activeAsset.symbol}
                <ChevronDown size={11} className="text-faint shrink-0" />
              </button>
            </div>
          </div>

          <div className="border-l border-line/50 h-8 hidden sm:block" />

          <div>
            <span className="text-2xs text-muted select-none font-subheading flex items-center gap-1">
              <Activity size={10} className="text-muted shrink-0" />
              Mark Price
            </span>
            <strong className="font-data text-xs text-ink animate-pulse block mt-1.5">
              ${activeAsset.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </strong>
          </div>

          <div className="border-l border-line/50 h-8 hidden sm:block" />

          <div>
            <span className="text-2xs text-muted block select-none font-subheading">24h Change</span>
            <span className={`font-data font-bold flex items-center gap-1 mt-1.5 ${activeAsset.change >= 0 ? "text-positive" : "text-negative"}`}>
              {activeAsset.change >= 0 ? <TrendingUp size={12} className="text-positive shrink-0" /> : <TrendingDown size={12} className="text-negative shrink-0" />}
              {activeAsset.change >= 0 ? "+" : ""}{activeAsset.change}%
            </span>
          </div>
        </div>

        {/* Available user metrics */}
        <div className="flex items-center gap-6 font-data font-semibold">
          <div className="text-right">
            <div className="flex items-center gap-2 justify-end text-muted">
              <span className="text-2xs select-none font-subheading">Available Balance</span>
              <button
                type="button"
                onClick={() => setShowBalance(!showBalance)}
                className="text-muted hover:text-ink transition-colors cursor-pointer"
                title={showBalance ? "Hide balance" : "Show balance"}
              >
                {showBalance ? <Eye size={12} /> : <EyeOff size={12} />}
              </button>
            </div>
            <span className="text-accent block text-sm mt-0.5">
              {showBalance ? `$${user.balance.toLocaleString()}` : "••••••"}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Main Two-Column Advanced Layout Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Watchlist column (col-span-3) */}
        <div className="lg:col-span-3 bg-surface border border-line rounded-xl p-4 flex flex-col justify-between font-sans">
          <div className="space-y-4">
            <h3 className="text-xs font-bold font-heading text-ink border-b border-line/50 pb-2 flex items-center gap-1.5">
              <BarChart2 size={13} className="text-muted shrink-0" />
              Market Watchlist
            </h3>

            <div className="space-y-1.5 h-[340px] overflow-y-auto pr-1">
              {fullMarketList.map((item) => (
                <div
                  key={item.symbol}
                  onClick={() => setSelectedAssetSymbol(item.symbol)}
                  className={`p-2 rounded-lg cursor-pointer flex items-center justify-between text-xs transition-colors border ${
                    selectedAssetSymbol === item.symbol 
                      ? "bg-accent/15 border-accent/40" 
                      : "border-transparent hover:bg-panel/50"
                  }`}
                >
                  <div className="font-data">
                    <span className="block font-bold text-ink">{item.symbol}</span>
                    <span className="text-2xs text-muted font-sans line-clamp-1">{item.name}</span>
                  </div>

                  <div className="text-right font-data font-medium">
                    <span className="block text-ink">${item.price.toLocaleString(undefined, { minimumFractionDigits: item.price > 10 ? 2 : 4 })}</span>
                    <span className={`text-2xs font-bold ${item.change >= 0 ? "text-positive" : "text-negative"}`}>
                      {item.change >= 0 ? "+" : ""}{item.change}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-line/40 text-2xs text-muted text-center font-sans">
            Real-time market data feed.
          </div>
        </div>

        {/* Middle Interactive TV Candlestick chart (col-span-6) */}
        <div className="lg:col-span-6">
          <TradingViewWidget symbol={selectedAssetSymbol} />
        </div>

        {/* Right Collateral Order execution ticket column (col-span-3) */}
        <div className="lg:col-span-3 bg-surface border border-line rounded-xl p-5 flex flex-col justify-between font-sans">
          <form onSubmit={handleOrderSubmit} className="space-y-4">
            
            {/* Buy / Sell Tab selector */}
            <div className="flex bg-ground border border-line rounded-lg p-1">
              <button
                type="button"
                onClick={() => setTradeType("buy")}
                className={`flex-1 py-1.5 text-xs font-bold rounded font-subheading cursor-pointer transition-all ${
                  tradeType === "buy" ? "bg-positive text-ground" : "text-muted hover:text-ink"
                }`}
              >
                BUY LONG
              </button>
              <button
                type="button"
                onClick={() => setTradeType("sell")}
                className={`flex-1 py-1.5 text-xs font-bold rounded font-subheading cursor-pointer transition-all ${
                  tradeType === "sell" ? "bg-negative text-ink" : "text-muted hover:text-ink"
                }`}
              >
                SELL SHORT
              </button>
            </div>

            {/* Limit vs Market trigger options */}
            <div className="flex justify-between items-center text-2xs text-muted border-b border-line/40 pb-2">
              <span className="font-subheading">Order Execution Type</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setOrderType("market")}
                  className={`underline cursor-pointer font-subheading ${orderType === "market" ? "text-accent" : ""}`}
                >
                  Market
                </button>
                <button
                  type="button"
                  onClick={() => setOrderType("limit")}
                  className={`underline cursor-pointer font-subheading ${orderType === "limit" ? "text-accent" : ""}`}
                >
                  Limit
                </button>
              </div>
            </div>

            {/* Display message logs */}
            {log && (
              <div className={`p-2 text-2xs rounded-lg border font-medium font-sans ${
                log.startsWith("Error") ? "bg-negative/10 border-negative/30 text-negative" : "bg-positive/10 border-positive/30 text-positive"
              }`}>
                {log}
              </div>
            )}

            {/* Render input trigger rates for LIMIT orders */}
            {orderType === "limit" && (
              <div className="space-y-1">
                <label className="text-2xs font-subheading text-muted uppercase">
                  Order Price
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={priceInput}
                  onChange={(e) => setPriceInput(e.target.value)}
                  className="w-full bg-ground border border-line rounded-lg py-2 px-3 text-xs font-data font-bold text-ink focus:border-accent focus:outline-none"
                />
              </div>
            )}

            {/* Capital Allocation Size */}
            <div className="space-y-1.5 font-sans">
              <div className="flex justify-between text-2xs uppercase font-subheading text-muted">
                <span>Order Qty</span>
                <span>Limits: min $10</span>
              </div>
              <input
                type="number"
                min="10"
                required
                value={amountInputTxt}
                onChange={(e) => setAmountInputTxt(e.target.value)}
                placeholder="Amount (USDT)"
                className="w-full bg-ground border border-line rounded-lg py-2 px-3 text-xs font-data font-bold text-ink focus:border-accent focus:outline-none"
              />
            </div>

            {/* Leverage Sliders */}
            <div className="space-y-1.5 font-sans">
              <div className="flex justify-between text-2xs font-subheading text-muted uppercase select-none">
                <span>Leverage</span>
              </div>
              <input
                type="range"
                min="1"
                max="50"
                value={leverage}
                onChange={(e) => setLeverage(parseInt(e.target.value))}
                className="w-full h-1 bg-line rounded appearance-none cursor-pointer accent-accent"
              />
              <div className="flex justify-between text-2xs font-data text-muted">
                <span>1x (Cash)</span>
                <span>25x</span>
                <span>50x Max</span>
              </div>
            </div>

            {/* Margin calculation stats summary */}
            <div className="pt-2 border-t border-line/40 space-y-1.5 text-2xs text-muted font-sans">
              <div className="flex justify-between">
                <span>Order Qty ({activeAsset.symbol.split("/")[0]}):</span>
                <span className="font-data text-ink">
                  {amountInputTxt ? +(parseFloat(amountInputTxt) / (orderType === "market" ? activeAsset.price : parseFloat(priceInput))).toFixed(6) : "0.0000"}  {activeAsset.symbol.split("/")[0]}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Order Cost:</span>
                <span className="font-data text-ink">
                  ${amountInputTxt ? +(parseFloat(amountInputTxt) / leverage).toFixed(2) : "0.00"} USD
                </span>
              </div>
              <div className="flex justify-between font-data font-bold border-t border-line/30 pt-1.5">
                <span className="text-accent font-subheading">Order Value:</span>
                <span className="text-ink">${amountInputTxt || "0.00"}</span>
              </div>
            </div>

            <button
              type="submit"
              className={`w-full py-3 mt-4 rounded-xl font-bold font-subheading text-xs uppercase shadow transition-all transform hover:-translate-y-0.5 cursor-pointer shadow-accent/10 ${
                tradeType === "buy" ? "bg-positive text-ground" : "bg-negative text-ink"
              }`}
            >
              {tradeType === "buy" ? "BUY LONG" : "SELL SHORT"}
            </button>
          </form>

          {/* Quick solicitation helper */}
          <div className="text-2xs text-muted leading-snug border-t border-line/30 pt-3 flex gap-2 font-sans">
            <ShieldAlert size={18} className="text-amber-500 shrink-0 mt-0.5" />
            <span>Risk Warning: High leverage carries liquidation risks. Manage your exposure accordingly.</span>
          </div>
        </div>

      </div>

      {/* 3. Bottom List: Open Positions / Portfolio holdings detail summaries */}
      <section className="bg-surface border border-line rounded-xl p-5 space-y-4 font-sans">
        <h3 className="text-xs font-bold font-heading tracking-widest text-accent border-b border-line/50 pb-2">
          Open Positions
        </h3>

        {user.portfolio.length === 0 ? (
          <p className="text-xs text-center text-muted py-4 font-sans">No open positions.</p>
        ) : (
          <div className="overflow-x-auto text-xs text-left font-sans">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-line font-subheading uppercase tracking-wider text-2xs text-muted bg-panel/40">
                  <th className="p-3 pl-4">Asset Ticker</th>
                  <th className="p-3">Current Size</th>
                  <th className="p-3">Average purchase basis</th>
                  <th className="p-3">Settlement Index</th>
                  <th className="p-3">Cumulative net Return</th>
                  <th className="p-3 text-right pr-4">Hedge Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/30 font-data">
                {user.portfolio.map((asset) => {
                  const buyValue = asset.amount * asset.avgBuyPrice;
                  const curValue = asset.amount * asset.currentPrice;
                  const pl = +(curValue - buyValue).toFixed(2);
                  const plpct = buyValue > 0 ? +((pl / buyValue) * 100).toFixed(2) : 0;
                  return (
                    <tr key={asset.symbol} className="hover:bg-panel/50 transition-colors">
                      <td className="p-3 pl-4 font-bold text-ink">{asset.symbol}</td>
                      <td className="p-3 text-ink font-semibold">{asset.amount}</td>
                      <td className="p-3 text-muted font-sans">${asset.avgBuyPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="p-3 text-ink font-semibold animate-pulse">${asset.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className={`p-3 font-bold ${pl >= 0 ? "text-positive" : "text-negative"}`}>
                        {pl >= 0 ? "+" : ""}{pl.toLocaleString()} ({plpct}%)
                      </td>
                      <td className="p-3 pr-4 text-right text-positive font-bold font-subheading">
                        🟢 HEDGED COLD SECURE
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

    </div>
  );
};
