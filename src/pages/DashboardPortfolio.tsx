import React, { useMemo, useState } from "react";
import { useApp } from "../context/AppContext";
import { TrendingUp, Award, Layers, Sparkles, PieChart, Info, ShieldAlert, Briefcase, Target, Users, Wallet } from "lucide-react";

interface DashboardPortfolioProps {
  onNavigate: (view: string) => void;
}

export const DashboardPortfolio: React.FC<DashboardPortfolioProps> = ({ onNavigate }) => {
  const { user, claimCopyTradePayout } = useApp();
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const handleClaimCopyPayout = async (copyTradeId: string) => {
    setClaimingId(copyTradeId);
    try {
      await claimCopyTradePayout(copyTradeId);
    } finally {
      setClaimingId(null);
    }
  };

  const stats = useMemo(() => {
    const totalHoldingValue = user.portfolioValue;
    // Running OR matured-but-unclaimed both stay in the "active" list so the
    // Claim Payout action is visible on the position card. Only trades whose
    // payout has actually been claimed (payoutCompleted) move to history.
    const activeCopyTrades = user.copyTrades.filter(trade => trade.status === "Running" || (trade.status === "Completed" && !trade.payoutCompleted));
    const completedCopyTrades = user.copyTrades.filter(trade => trade.status === "Completed" && trade.payoutCompleted);

    // Let's compute individual asset percentages
    const preProcessedPortfolio = user.portfolio.map(asset => {
      const totalAssetMarketVal = asset.amount * asset.currentPrice;
      const totalCostValue = asset.amount * asset.avgBuyPrice;
      const profitLossVal = +(totalAssetMarketVal - totalCostValue).toFixed(2);
      const profitLossPercent = totalCostValue > 0 ? +((profitLossVal / totalCostValue) * 100).toFixed(2) : 0;
      const weightPercent = totalHoldingValue > 0 ? +((totalAssetMarketVal / totalHoldingValue) * 100).toFixed(1) : 0;

      return {
        ...asset,
        marketValue: totalAssetMarketVal,
        costBasis: totalCostValue,
        profitLoss: profitLossVal,
        profitLossPct: profitLossPercent,
        weight: weightPercent
      };
    });

    // Calculate cumulative stats
    const aggregateCost = preProcessedPortfolio.reduce((acc, cur) => acc + cur.costBasis, 0);
    const aggregatePnL = +(totalHoldingValue - aggregateCost).toFixed(2);
    const aggregatePnLPct = aggregateCost > 0 ? +((aggregatePnL / aggregateCost) * 100).toFixed(2) : 0;

    // Fix Total Equity to include user's actual balance and active investments
    const runningInvestments = user.activeInvestments.filter(item => item.status === "Running" || item.status === "active");
    const activePlanCapital = runningInvestments.reduce((acc, current) => acc + current.amount, 0);
    const activePlanProfits = runningInvestments.reduce((acc, current) => acc + current.accumulatedProfit, 0);
    const activeCopyCapital = activeCopyTrades.reduce((acc, current) => acc + current.amountInvested, 0);
    const activeCopyExpectedProfit = activeCopyTrades.reduce((acc, current) => acc + current.expectedProfit, 0);
    const totalEquity = +(user.balance + totalHoldingValue + activePlanCapital + activePlanProfits + activeCopyCapital + activeCopyExpectedProfit).toFixed(2);
    
    return {
      totalHoldingValue,
      activeCopyTrades,
      completedCopyTrades,
      preProcessedPortfolio,
      aggregateCost,
      aggregatePnL,
      aggregatePnLPct,
      totalEquity
    };
  }, [user]);

  const {
    totalHoldingValue,
    activeCopyTrades,
    completedCopyTrades,
    preProcessedPortfolio,
    aggregateCost,
    aggregatePnL,
    aggregatePnLPct,
    totalEquity
  } = stats;

  return (
    <div className="space-y-4 pb-4 sm:pb-6 font-sans">
      
      {/* Header Info */}
      <div className="border-b border-line/50 pb-6">
        <h1 className="text-2xl font-bold font-heading text-ink flex items-center gap-2.5">
          <Briefcase size={24} className="text-accent shrink-0" />
          <span>Portfolio Overview</span>
        </h1>
        <p className="text-xs text-muted mt-1 font-sans">
          Real-time track and manage your balances, active positions, and copy trading performance.
        </p>
      </div>

      {/* Aggregate metrics box */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-sans">
        <div className="bg-surface border border-line rounded-2xl p-4 space-y-2">
          <div className="flex justify-between items-center text-2xs text-muted font-subheading">
            <span>Total Equity</span>
            <Wallet size={14} className="text-muted/70 shrink-0" />
          </div>
          <strong className="text-2xl font-black font-data text-ink block">${totalEquity.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
        </div>

        <div className="bg-surface border border-line rounded-xl p-6 space-y-2">
          <div className="flex justify-between items-center text-2xs text-muted font-subheading">
            <span>Asset Value</span>
            <Layers size={14} className="text-muted/70 shrink-0" />
          </div>
          <strong className="text-2xl font-black font-data text-accent block">${totalHoldingValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
        </div>

        <div className="bg-surface border border-line rounded-xl p-6 space-y-2">
          <div className="flex justify-between items-center text-2xs text-muted font-subheading">
            <span>Total PnL</span>
            <TrendingUp size={14} className="text-muted/70 shrink-0" />
          </div>
          <strong className={`text-2xl font-data font-black block ${aggregatePnL >= 0 ? "text-positive" : "text-negative"}`}>
            {aggregatePnL >= 0 ? "+" : ""}{aggregatePnL.toLocaleString()} ({aggregatePnLPct}%)
          </strong>
        </div>
      </div>

      {/* Main split grid: Radial wheel + list detailing */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch font-sans">
        
        {/* Left column: Visual radial weights wheel (col-span-4) */}
        <div className="lg:col-span-5 bg-surface border border-line rounded-2xl p-4 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-sm font-bold font-heading text-ink flex items-center gap-2">
              <PieChart size={16} className="text-accent" />
              Allocation Weights
            </h3>

            {preProcessedPortfolio.length === 0 ? (
              <p className="text-xs text-center text-muted py-16 font-sans">No asset distribution data available. Fund your account or open a position to view metrics.</p>
            ) : (
              <div className="flex flex-col items-center justify-center p-4 relative space-y-6">
                
                {/* Simulated CSS Radial Stack Gauge */}
                <div className="relative w-40 h-40 rounded-full bg-panel border border-line flex items-center justify-center shadow-xl">
                  {/* Inside metrics */}
                  <div className="text-center font-sans">
                    <span className="text-2xs text-muted uppercase tracking-normal font-subheading">Active Assets</span>
                    <strong className="block text-lg font-black font-data text-ink">{preProcessedPortfolio.length} Pairs</strong>
                  </div>

                  {/* Gradient rings representing sizes */}
                  <div className="absolute inset-2 border-2 border-dashed border-accent/30 rounded-full animate-spin" style={{ animationDuration: "35s" }} />
                  <div className="absolute inset-4 border-2 border-dashed border-positive/20 rounded-full animate-spin" style={{ animationDuration: "15s" }} />
                </div>

                {/* Legend checklist */}
                <div className="w-full space-y-2.5 font-sans">
                  {preProcessedPortfolio.map((item, idx) => {
                    const colors = ["#FFA500", "#0ECB81", "#3B82F6", "#8B5CF6", "#EC4899"];
                    const styleCol = colors[idx % colors.length];
                    return (
                      <div key={item.symbol} className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: styleCol }} />
                          <span className="font-bold text-ink uppercase font-data">{item.symbol}</span>
                          <span className="text-muted font-sans">{item.name}</span>
                        </div>
                        <span className="font-data text-ink font-bold">{item.weight}%</span>
                      </div>
                    );
                  })}
                </div>

              </div>
            )}
          </div>

          <div className="pt-4 border-t border-line/40 text-2xs text-muted text-center font-sans">
            Prices update in real time.
          </div>
        </div>

        {/* Right column: Tabular details (col-span-8) */}
        <div className="lg:col-span-7 bg-surface border border-line rounded-2xl p-4 space-y-4">
          <div className="flex justify-between items-center border-b border-line/50 pb-4">
            <h3 className="text-sm font-bold font-heading text-ink flex items-center gap-2">
              <Target size={16} className="text-accent" />
              <span>Open Positions</span>
            </h3>
            <button 
              onClick={() => onNavigate("dashboard-trading")}
              className="text-xs text-accent font-subheading hover:underline cursor-pointer"
            >
              Trade Now
            </button>
          </div>

          {preProcessedPortfolio.length === 0 ? (
            <p className="text-xs text-center text-muted py-12 font-sans">No open positions. Start trading to view your portfolio here.</p>
          ) : (
            <div className="space-y-4 font-sans">
              {preProcessedPortfolio.map((holding) => (
                <div 
                  key={holding.symbol}
                  className="p-4 rounded-xl border border-line bg-ground/40 flex justify-between items-center text-xs"
                >
                  <div className="space-y-1">
                    <strong className="font-data text-sm text-ink">{holding.symbol}</strong>
                    <span className="text-2xs text-muted block">
                      Quantity: <strong className="font-data">{holding.amount}</strong> | Weight: <span className="font-data">{holding.weight}%</span>
                    </span>
                  </div>

                  <div className="space-y-1 font-data text-right">
                    <span className="text-ink text-sm font-bold block">
                      ${holding.marketValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                    <span className={`text-2xs font-bold ${holding.profitLoss >= 0 ? "text-positive" : "text-negative"}`}>
                      {holding.profitLoss >= 0 ? "Profit: +" : "Loss: "}${holding.profitLoss.toLocaleString()} ({holding.profitLossPct}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Copy trading positions */}
      <section className="bg-surface border border-line rounded-2xl p-4 font-sans space-y-5">
        <div className="flex items-center justify-between gap-3 border-b border-line/50 pb-3">
          <h3 className="text-sm font-bold font-heading text-ink flex items-center gap-2">
            <Users size={16} className="text-accent" />
            <span>Active Copy Trades</span>
          </h3>
          <button 
            onClick={() => onNavigate("copy-trading")}
            className="px-4 py-2 rounded-lg bg-ground border border-line hover:border-accent text-ink text-xs font-semibold font-subheading transition-colors cursor-pointer"
          >
            Copy Traders
          </button>
        </div>

        {activeCopyTrades.length === 0 ? (
          <p className="text-xs text-muted leading-relaxed font-sans py-4">
            No active copy trades. Select a trader to start a timestamped copy allocation.
          </p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {activeCopyTrades.map(trade => {
              const isClaimable = trade.status === "Completed" && !trade.payoutCompleted;
              const isClaiming = claimingId === trade.id;
              return (
              <div key={trade.id} className="p-4 rounded-xl border border-line bg-ground/40 space-y-3 text-xs">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <strong className="text-ink font-subheading block">{trade.traderName}</strong>
                    <span className="text-2xs text-muted font-data">{isClaimable ? "Matured" : `${trade.remainingDays}d remaining`}</span>
                  </div>
                  <span className={`px-2 py-1 rounded font-bold font-subheading text-2xs border ${isClaimable ? "bg-positive/10 text-positive border-positive/30" : "bg-accent/10 text-accent border-accent/30"}`}>
                    {isClaimable ? "Matured" : trade.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-2xs font-data">
                  <span className="text-muted">Invested <strong className="block text-ink">${trade.amountInvested.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></span>
                  <span className="text-muted">ROI <strong className="block text-positive">{trade.roiPercent}%</strong></span>
                  <span className="text-muted">Expected profit <strong className="block text-positive">${trade.expectedProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></span>
                  <span className="text-muted">Total return <strong className="block text-ink">${trade.totalReturn.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></span>
                </div>
                <div className="w-full bg-line h-1.5 rounded-full overflow-hidden">
                  <div className="bg-accent h-full" style={{ width: `${trade.progress}%` }} />
                </div>
                <p className="text-2xs text-muted font-data">Ends: {new Date(trade.endTimestamp).toLocaleString()}</p>
                {isClaimable && (
                  <button
                    type="button"
                    onClick={() => handleClaimCopyPayout(trade.id)}
                    disabled={isClaiming}
                    className="w-full bg-positive/15 border border-positive/40 text-positive hover:bg-positive/25 disabled:opacity-60 disabled:cursor-not-allowed font-bold font-subheading py-1.5 rounded text-center uppercase text-2xs transition-colors"
                  >
                    {isClaiming ? "Claiming…" : `Claim Payout $${trade.totalReturn.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                  </button>
                )}
              </div>
              );
            })}
          </div>
        )}

        <div className="border-t border-line/50 pt-4 space-y-3">
          <h4 className="text-xs font-bold font-heading text-ink">Copy Trade History</h4>
          {completedCopyTrades.length === 0 ? (
            <p className="text-xs text-muted py-2">No completed copy trades yet.</p>
          ) : (
            <div className="space-y-2">
              {completedCopyTrades.map(trade => (
                <div key={trade.id} className="grid grid-cols-2 md:grid-cols-6 gap-2 p-3 rounded-lg border border-line/60 bg-ground/30 text-2xs font-data">
                  <span className="text-ink font-bold md:col-span-2">{trade.traderName}</span>
                  <span className="text-muted">Invested ${trade.amountInvested.toLocaleString()}</span>
                  <span className="text-positive">Profit ${trade.expectedProfit.toLocaleString()}</span>
                  <span className="text-ink">Returned ${trade.totalReturn.toLocaleString()}</span>
                  <span className="text-positive font-subheading">{trade.payoutCompleted ? "Paid" : trade.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

    </div>
  );
};

