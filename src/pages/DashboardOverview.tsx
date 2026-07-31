import React, { useState, useMemo } from "react";
import { useApp } from "../context/AppContext";
import { 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight, 
  Briefcase, 
  Layers, 
  Activity, 
  PlusCircle, 
  MinusCircle, 
  History,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Wallet,
  Shield,
  Copy,
  Check,
  Plus
} from "lucide-react";
import { motion } from "motion/react";
import { DashboardEquityChart } from "../components/charts/DashboardEquityChart";
import { UserAnnouncements } from "../components/announcements/UserAnnouncements";

interface DashboardOverviewProps {
  onNavigate: (view: string) => void;
  onOpenDeposit: () => void;
  onOpenWithdraw: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({ 
  onNavigate, 
  onOpenDeposit, 
  onOpenWithdraw 
}) => {
  const { user, plans, topUpInvestment, claimPlanPayout, claimCopyTradePayout, addNotification, siteContent, setInsufficientBalanceOpen } = useApp();
  const [copiedUid, setCopiedUid] = useState(false);
  const [claimingCopyId, setClaimingCopyId] = useState<string | null>(null);
  const [claimingInvId, setClaimingInvId] = useState<string | null>(null);
  const [topUpTarget, setTopUpTarget] = useState<string | null>(null);

  const handleClaimCopyPayout = async (copyTradeId: string) => {
    setClaimingCopyId(copyTradeId);
    try {
      await claimCopyTradePayout(copyTradeId);
    } finally {
      setClaimingCopyId(null);
    }
  };

  const handleClaimInvPayout = async (investmentId: string) => {
    setClaimingInvId(investmentId);
    try {
      await claimPlanPayout(investmentId);
    } finally {
      setClaimingInvId(null);
    }
  };
  const [topUpAmount, setTopUpAmount] = useState<string>("");

  const getUID = (email: string | null) => {
    if (!email) return "0000000";
    let hash = 0;
    for (let i = 0; i < email.length; i++) {
      hash = (email.charCodeAt(i) + ((hash << 5) - hash)) | 0;
    }
    return String(Math.abs(hash) % 10000000).padStart(7, "0");
  };

  const uid = getUID(user.email);

  const handleTopUp = async (invId: string) => {
    const val = parseFloat(topUpAmount);
    if (isNaN(val) || val <= 0) {
      addNotification("Please enter a valid amount to top up.");
      return;
    }
    const res = await topUpInvestment(invId, val);
    if (res.success) {
      setTopUpTarget(null);
      setTopUpAmount("");
    } else {
      if (res.message === "INSUFFICIENT_BALANCE") {
        setInsufficientBalanceOpen(true);
      } else {
        addNotification(res.message);
      }
    }
  };

  // Compute stats
  const stats = useMemo(() => {
    const availableCash = user.balance;
    const portfolioAssetsValue = user.portfolioValue; // Auto-updates via context market loops
    const runningInvestments = user.activeInvestments.filter(item => item.status === "Running" || item.status === "active");
    // Matured-but-unclaimed copy trades (live-derived status "Completed" but
    // payout not yet claimed) count as still-active for net-worth purposes —
    // their capital+profit hasn't hit the balance yet. Only actually-paid
    // trades (payoutCompleted) move to the completed/history bucket. Without
    // this, a matured trade's value would vanish from equity until claimed.
    const runningCopyTrades = user.copyTrades.filter(item => item.status === "Running" || (item.status === "Completed" && !item.payoutCompleted));
    const completedCopyTrades = user.copyTrades.filter(item => item.status === "Completed" && item.payoutCompleted);
    const activePlanCapital = runningInvestments.reduce((acc, current) => acc + current.amount, 0);
    const activePlanProfits = runningInvestments.reduce((acc, current) => acc + current.accumulatedProfit, 0);
    const activeCopyCapital = runningCopyTrades.reduce((acc, current) => acc + current.amountInvested, 0);
    const activeCopyExpectedProfit = runningCopyTrades.reduce((acc, current) => acc + current.expectedProfit, 0);
    
    const aggregateNetWorth = +(availableCash + portfolioAssetsValue + activePlanCapital + activePlanProfits + activeCopyCapital + activeCopyExpectedProfit).toFixed(2);
    
    // Calculate P/L matching average purchase prices
    const totalCostBasis = user.portfolio.reduce((acc, cur) => acc + (cur.amount * cur.avgBuyPrice), 0);
    const netPnL = totalCostBasis > 0 ? +(portfolioAssetsValue - totalCostBasis).toFixed(2) : 0;
    const netPnLPercent = totalCostBasis > 0 ? +((netPnL / totalCostBasis) * 100).toFixed(2) : 0;

    return {
      availableCash,
      portfolioAssetsValue,
      runningInvestments,
      runningCopyTrades,
      completedCopyTrades,
      activePlanCapital,
      activePlanProfits,
      activeCopyCapital,
      activeCopyExpectedProfit,
      aggregateNetWorth,
      netPnL,
      netPnLPercent
    };
  }, [user]);

  const {
    availableCash,
    portfolioAssetsValue,
    runningInvestments,
    runningCopyTrades,
    completedCopyTrades,
    activePlanCapital,
    activePlanProfits,
    activeCopyCapital,
    activeCopyExpectedProfit,
    aggregateNetWorth,
    netPnL,
    netPnLPercent
  } = stats;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants: any = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-4 pb-4 sm:pb-6"
    >
      
      {/* 1. Header welcome */}
      <motion.div variants={itemVariants} className="flex flex-col gap-3 border-b border-line/50 pb-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <Wallet size={24} className="text-accent shrink-0" />
            <h1 className="text-2xl font-bold font-sans tracking-tight text-ink">
              Asset Overview
            </h1>
          </div>
          <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-sans">
            <span className="text-muted">
              Welcome back, <span className="text-ink font-medium">{(user.name || user.email || "").toLowerCase()}</span>
            </span>
            
            <span className="hidden sm:inline text-faint select-none font-normal">•</span>

            {/* UID Badge with Copy Action */}
            <div className="flex items-center gap-1.5 text-2xs text-faint bg-surface/50 hover:bg-surface border border-line/40 py-0.5 px-2 rounded-md transition-all">
              <span className="text-2xs uppercase tracking-wider text-faint font-bold font-mono">UID</span>
              <span className="font-mono text-muted font-medium select-all">{uid}</span>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(uid);
                  setCopiedUid(true);
                  setTimeout(() => setCopiedUid(false), 2000);
                }}
                className="text-faint hover:text-accent transition-colors p-0.5"
                title="Copy UID"
              >
                {copiedUid ? <Check size={11} className="text-positive" /> : <Copy size={11} />}
              </button>
            </div>

            {/* Security Badge */}
            <div className="flex items-center gap-1.5 text-2xs text-faint bg-surface/50 border border-line/40 py-0.5 px-2 rounded-md">
              <Shield size={11} className="text-faint shrink-0" />
              <span className="text-muted">Security:</span>
              <span className="text-positive font-bold tracking-wide">High</span>
            </div>

            {/* Verification Badge */}
            {user.kyc?.status === "approved" ? (
              <div className="flex items-center gap-1 text-2xs bg-positive/10 text-positive border border-positive/20 py-0.5 px-2.5 rounded-full font-medium shadow-sm">
                <CheckCircle2 size={11} className="text-positive shrink-0" />
                <span>Identity Verified</span>
              </div>
            ) : user.kyc?.status === "pending" ? (
              <div className="flex items-center gap-1 text-2xs bg-amber-500/10 text-amber-400 border border-amber-500/20 py-0.5 px-2.5 rounded-full font-medium shadow-sm">
                <AlertTriangle size={11} className="text-amber-400 shrink-0" />
                <span>Verification Pending</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-2xs bg-negative/10 text-negative border border-negative/20 py-0.5 px-2.5 rounded-full font-medium shadow-sm">
                <AlertTriangle size={11} className="text-negative shrink-0" />
                <span>Unverified Identity</span>
              </div>
            )}
          </div>
        </div>
 
        {/* Quick Deposit/Withdraw Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenDeposit}
            className="flex items-center gap-1.5 px-4 py-2 bg-accent text-ground font-bold font-subheading text-xs rounded-xl hover:opacity-95 shadow shadow-accent/20 hover:-translate-y-0.5 transition-all cursor-pointer"
          >
            <PlusCircle size={14} /> Deposit
          </button>
          <button
            onClick={onOpenWithdraw}
            className="flex items-center gap-1.5 px-4 py-2 bg-surface border border-line hover:bg-surface/80 text-ink font-semibold font-subheading text-xs rounded-xl hover:-translate-y-0.5 transition-all cursor-pointer"
          >
            <MinusCircle size={14} /> Withdraw
          </button>
        </div>
      </motion.div>

      <UserAnnouncements />
 
      {/* 2. Core balances cards row */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-sans">
        
        {/* Net Worth */}
        <div className="bg-gradient-to-br from-surface to-surface/50 border border-line rounded-xl p-5 hover:border-accent/40 hover:-translate-y-1 hover:shadow-lg hover:shadow-accent/5 transition-all duration-300 group">
          <div className="flex justify-between items-start text-muted">
            <span className="text-2xs uppercase font-sans font-medium tracking-wider text-muted group-hover:text-ink transition-colors">Total Equity</span>
            <span className="p-1.5 rounded-lg bg-accent/10 text-accent group-hover:bg-accent group-hover:text-ink transition-colors">
              <Briefcase size={16} />
            </span>
          </div>
          <div className="mt-3 space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black font-data text-ink select-all">
                ${aggregateNetWorth.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
              <span className="text-2xs text-faint font-data font-medium">
                ≈ {((aggregateNetWorth) / 68500).toFixed(4)} BTC
              </span>
            </div>
            <div className="flex items-center gap-1 text-2xs">
              <span className={`flex items-center font-data font-bold ${netPnL >= 0 ? "text-positive" : "text-negative"}`}>
                {netPnL >= 0 ? "+" : ""}{netPnL.toLocaleString()} ({netPnLPercent}%)
              </span>
              <span className="text-muted font-medium font-sans">Today's P&L</span>
            </div>
          </div>
        </div>
 
        {/* Available Cash balance */}
        <div className="bg-gradient-to-br from-surface to-surface/50 border border-line rounded-xl p-5 hover:border-accent/40 hover:-translate-y-1 hover:shadow-lg hover:shadow-accent/5 transition-all duration-300 group">
          <div className="flex justify-between items-start text-muted">
            <span className="text-2xs uppercase font-sans font-medium tracking-wider text-muted group-hover:text-ink transition-colors">Available Balance</span>
            <span className="p-1.5 rounded-lg bg-positive/10 text-positive group-hover:bg-positive group-hover:text-ink transition-colors">
              <DollarSign size={16} />
            </span>
          </div>
          <div className="mt-4 space-y-1">
            <span className="text-2xl font-black font-data text-ink select-all">
              ${availableCash.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            <p className="text-2xs text-muted tracking-normal font-sans font-medium">
              In Orders: <span className="font-data">${(activePlanCapital + activeCopyCapital).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span> USD
            </p>
          </div>
        </div>
 
        {/* Portfolio Assets value */}
        <div className="bg-gradient-to-br from-surface to-surface/50 border border-line rounded-xl p-5 hover:border-accent/40 hover:-translate-y-1 hover:shadow-lg hover:shadow-accent/5 transition-all duration-300 group">
          <div className="flex justify-between items-start text-muted">
            <span className="text-2xs uppercase font-sans font-medium tracking-wider text-muted group-hover:text-ink transition-colors">Derivatives Account</span>
            <span className="p-1.5 rounded-lg bg-negative/10 text-negative group-hover:bg-negative group-hover:text-ink transition-colors">
              <Activity size={16} />
            </span>
          </div>
          <div className="mt-4 space-y-1">
            <span className="text-xl font-black font-data text-ink animate-pulse">
              ${portfolioAssetsValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            <p className="text-2xs text-muted font-sans font-medium">
              Fluctuating with global indexes
            </p>
          </div>
        </div>
 
        {/* Dynamic active plan totals */}
        <div className="bg-gradient-to-br from-surface to-surface/50 border border-line rounded-xl p-5 hover:border-accent/40 hover:-translate-y-1 hover:shadow-lg hover:shadow-accent/5 transition-all duration-300 group relative overflow-hidden">
          {/* Subtle gold flare for yield */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 blur-3xl rounded-full" />
          <div className="flex justify-between items-start text-muted relative z-10">
            <span className="text-2xs uppercase font-sans font-medium tracking-wider text-muted group-hover:text-ink transition-colors">Plan Yield Capital</span>
            <span className="p-1.5 rounded-lg bg-accent/10 text-accent group-hover:bg-accent group-hover:text-ink transition-colors">
              <Layers size={16} />
            </span>
          </div>
          <div className="mt-4 space-y-1 relative z-10">
            <span className="text-xl font-black font-data text-accent">
              ${(activePlanCapital + activePlanProfits).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            <p className="text-2xs text-positive font-data">
              +{activePlanProfits > 0 ? `$${activePlanProfits.toFixed(2)} accrued` : "0.00 accruals"}
            </p>
          </div>
        </div>
 
      </motion.div>

      {/* 2.5 Portfolio Performance Chart */}
      <motion.div variants={itemVariants} className="bg-surface border border-line rounded-2xl p-4 hover:shadow-lg hover:shadow-accent/5 transition-all duration-300">
        <div className="flex justify-between items-center border-b border-line/60 pb-3">
          <div className="flex items-center gap-2">
            <Activity className="text-accent" size={18} />
            <h3 className="text-sm font-bold font-heading text-ink">30-Day Equity Trend</h3>
          </div>
          <span className="text-xs text-muted font-data">Live Updates</span>
        </div>
        <DashboardEquityChart currentEquity={aggregateNetWorth} />
      </motion.div>

      {/* 3. Middle split grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-12 gap-5 font-sans">
        
        {/* Left column: Active Investment plans */}
        <div className="lg:col-span-7 bg-surface border border-line rounded-2xl p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-line/60 pb-3">
            <h3 className="text-sm font-bold font-heading text-ink">Active Investments</h3>
            <button 
              onClick={() => onNavigate("dashboard-plans")}
              className="text-xs text-accent font-subheading hover:underline cursor-pointer"
            >
              View Plans
            </button>
          </div>

          {user.activeInvestments.length === 0 ? (
            <div className="py-8 text-center text-muted space-y-3 font-sans">
              <FileText className="mx-auto text-line" size={32} />
              <p className="text-xs">No active investments found.</p>
              <button
                onClick={() => onNavigate("dashboard-plans")}
                className="px-4 py-1.5 bg-line hover:bg-accent hover:text-ground text-2xs font-bold font-subheading text-ink rounded transition-colors cursor-pointer"
              >
                Explore Investment Plans
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {user.activeInvestments.map((inv) => {
                const isCompleted = inv.status === "Completed" || inv.status === "completed";
                const isPaid = isCompleted && Boolean(inv.payoutTransactionId);
                const isClaimable = isCompleted && !inv.payoutTransactionId;
                const isClaimingInv = claimingInvId === inv.id;
                const expectedProfit = inv.expectedProfit ?? inv.accumulatedProfit;
                const totalReturn = inv.totalReturn ?? inv.amount + expectedProfit;
                const remainingDays = inv.remainingDays ?? 0;
                return (
                  <div 
                    key={inv.id}
                    className="p-4 border border-line bg-panel/50 rounded-xl space-y-3"
                  >
                    <div className="flex justify-between items-center text-xs">
                      <div>
                        <span className="font-bold text-ink font-subheading">{inv.name}</span>
                        <span className="block text-2xs text-muted font-data">
                          Matures: {inv.endDate}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="block text-2xs text-muted uppercase font-subheading">Compounded profit</span>
                        <strong className="font-data text-positive font-bold">
                          +${(isCompleted ? expectedProfit : inv.accumulatedProfit).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </strong>
                      </div>
                    </div>

                    {/* Progress & Actions */}
                    <div className="flex items-center justify-between text-2xs mt-2">
                      <span className="text-muted">Allocated: ${inv.amount.toLocaleString()}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-muted">{isPaid ? "Completed" : isClaimable ? "Matured" : `${remainingDays}d left`}</span>
                        {!isCompleted && (<button
                          onClick={() => setTopUpTarget(topUpTarget === inv.id ? null : inv.id)}
                          className="text-2xs text-accent border border-accent/30 bg-accent/10 px-2 py-0.5 rounded flex items-center gap-1 hover:bg-accent/20 transition-colors"
                        >
                          <Plus size={10} /> Top Up
                        </button>)}
                      </div>
                    </div>

                    {/* Top Up Inline Form */}
                    {!isCompleted && topUpTarget === inv.id && (
                      <div className="pt-2 mt-2 border-t border-line/50 flex gap-2 animate-in slide-in-from-top-2">
                        <input 
                          type="number"
                          placeholder="Amount to add ($)"
                          value={topUpAmount}
                          onChange={(e) => setTopUpAmount(e.target.value)}
                          className="w-full bg-ground border border-line rounded px-3 py-1 text-xs text-ink outline-none focus:border-accent"
                        />
                        <button 
                          onClick={() => handleTopUp(inv.id)}
                          className="bg-accent text-ground px-3 py-1 rounded text-xs font-bold hover:opacity-90"
                        >
                          Confirm
                        </button>
                      </div>
                    )}
                    
                    <div className="w-full bg-ground rounded-full h-1.5 mt-2">
                      <div 
                        className="bg-accent h-1.5 rounded-full" 
                        style={{ width: `${inv.progress}%` }}
                      />
                    </div>
                    {isClaimable && (
                      <button
                        type="button"
                        onClick={() => handleClaimInvPayout(inv.id)}
                        disabled={isClaimingInv}
                        className="w-full py-2 bg-positive/15 border border-positive/40 text-positive hover:bg-positive/25 disabled:opacity-60 disabled:cursor-not-allowed font-bold font-subheading text-2xs rounded text-center uppercase transition-colors"
                      >
                        {isClaimingInv ? "Claiming…" : `Claim Payout $${totalReturn.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                      </button>
                    )}
                    {isPaid && (
                      <div className="w-full py-2 bg-positive/10 border border-positive/30 text-positive font-bold font-subheading text-2xs rounded text-center uppercase">
                        Paid ${totalReturn.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right column: Quick overview portfolio holdings */}
        <div className="lg:col-span-5 bg-surface border border-line rounded-xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-line/60 pb-4">
            <h3 className="text-sm font-bold font-heading text-ink">Open Positions</h3>
            <button 
              onClick={() => onNavigate("dashboard-portfolio")}
              className="text-xs font-subheading text-accent hover:underline cursor-pointer"
            >
              View Details
            </button>
          </div>

          {user.portfolio.length === 0 ? (
            <div className="py-12 text-center text-muted font-sans">
              <p className="text-xs">No open positions. Go to Trade to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {user.portfolio.map((asset) => {
                const totalCost = asset.amount * asset.avgBuyPrice;
                const totalMarket = asset.amount * asset.currentPrice;
                const profitLoss = +(totalMarket - totalCost).toFixed(2);
                
                return (
                  <div 
                    key={asset.symbol}
                    className="flex justify-between items-center p-3 border border-line/40 bg-ground/40 rounded-lg text-xs"
                  >
                    <div>
                      <strong className="font-data text-ink block">{asset.symbol}</strong>
                      <span className="text-2xs text-muted font-sans">{asset.amount} holdings</span>
                    </div>

                    <div className="text-right font-data">
                      <span className="text-ink block font-semibold">${totalMarket.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      <span className={`text-2xs font-bold ${profitLoss >= 0 ? "text-positive" : "text-negative"}`}>
                        {profitLoss >= 0 ? "+" : ""}{profitLoss.toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </motion.div>

      {/* 3.5 Copy trading engine */}
      <motion.section variants={itemVariants} className="bg-surface border border-line rounded-xl p-5 space-y-5 font-sans hover:shadow-lg hover:shadow-accent/5 transition-all duration-300">
        <div className="flex items-center justify-between border-b border-line/60 pb-3">
          <h3 className="text-sm font-bold font-heading text-ink">Active Copy Trades</h3>
          <button 
            onClick={() => onNavigate("copy-trading")}
            className="text-xs text-accent font-subheading hover:underline cursor-pointer"
          >
            View Traders
          </button>
        </div>

        {runningCopyTrades.length === 0 ? (
          <p className="text-xs text-center text-muted py-6 font-sans">No running copy trades.</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {runningCopyTrades.map(trade => {
              const isClaimable = trade.status === "Completed" && !trade.payoutCompleted;
              const isClaiming = claimingCopyId === trade.id;
              return (
              <div key={trade.id} className="p-4 border border-line bg-panel/50 rounded-xl space-y-3 text-xs">
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <span className="font-bold text-ink font-subheading">{trade.traderName}</span>
                    <span className="block text-2xs text-muted font-data">Ends: {new Date(trade.endTimestamp).toLocaleString()}</span>
                  </div>
                  <span className={`px-2 py-1 rounded text-2xs font-bold font-subheading border ${isClaimable ? "bg-positive/10 border-positive/30 text-positive" : "bg-accent/10 border-accent/30 text-accent"}`}>{isClaimable ? "Matured" : trade.status}</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-2xs font-data">
                  <span className="text-muted">Invested<strong className="block text-ink text-xs">${trade.amountInvested.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></span>
                  <span className="text-muted">ROI<strong className="block text-positive text-xs">{trade.roiPercent}%</strong></span>
                  <span className="text-muted">Profit<strong className="block text-positive text-xs">${trade.expectedProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></span>
                  <span className="text-muted">Total<strong className="block text-ink text-xs">${trade.totalReturn.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></span>
                </div>

                <div className="flex items-center justify-between text-2xs text-muted">
                  <span>{isClaimable ? "Matured" : `${trade.remainingDays}d remaining`}</span>
                  <span>{trade.progress}%</span>
                </div>
                <div className="w-full bg-ground rounded-full h-1.5">
                  <div className="bg-accent h-1.5 rounded-full" style={{ width: `${trade.progress}%` }} />
                </div>
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

        <div className="border-t border-line/60 pt-4 space-y-3">
          <h4 className="text-xs font-bold font-heading text-ink">History</h4>
          {completedCopyTrades.length === 0 ? (
            <p className="text-xs text-muted">No completed copy trades yet.</p>
          ) : (
            <div className="space-y-2">
              {completedCopyTrades.slice(0, 4).map(trade => (
                <div key={trade.id} className="grid grid-cols-2 md:grid-cols-5 gap-2 p-3 rounded-lg border border-line/50 bg-ground/30 text-2xs font-data">
                  <span className="text-ink font-bold">{trade.traderName}</span>
                  <span className="text-muted">ROI {trade.roiPercent}%</span>
                  <span className="text-muted">Invested ${trade.amountInvested.toLocaleString()}</span>
                  <span className="text-positive">Returned ${trade.totalReturn.toLocaleString()}</span>
                  <span className="text-positive font-subheading">{trade.payoutCompleted ? "Paid" : trade.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.section>

      {/* 4. Bottom Paginated Ledger Transactions */}
      <motion.section variants={itemVariants} className="bg-surface border border-line rounded-xl p-6 space-y-6 font-sans hover:shadow-lg hover:shadow-accent/5 transition-all duration-300">
        <div className="flex items-center justify-between border-b border-line/60 pb-4">
          <div className="flex items-center gap-2">
            <History className="text-accent animate-pulse" size={16} />
            <h3 className="text-sm font-bold font-heading text-ink">Recent Transactions</h3>
          </div>
          <button 
            onClick={() => onNavigate("dashboard-transactions")}
            className="text-xs text-muted hover:text-accent transition-colors"
          >
            View All
          </button>
        </div>

        {user.transactions.length === 0 ? (
          <p className="text-xs text-center text-muted py-6 font-sans">No past transactions found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse font-sans">
              <thead>
                <tr className="border-b border-line text-2xs uppercase font-subheading tracking-wider text-muted">
                  <th className="p-3">TxID</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Asset</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3 pr-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/30 font-data">
                {user.transactions.slice(0, 4).map((tx) => (
                  <tr key={tx.id} className="hover:bg-panel/40 transition-colors">
                    <td className="p-3 font-semibold text-ink">{tx.id}</td>
                    <td className="p-3 text-muted font-sans">{tx.date}</td>
                    <td className="p-3 uppercase">
                      <span className={`px-2 py-0.5 rounded text-2xs font-semibold font-subheading ${
                        tx.type === "deposit" ? "bg-positive/10 text-positive" : 
                        tx.type === "withdrawal" ? "bg-negative/10 text-negative" : 
                        tx.type === "investment" ? "bg-accent/15 text-accent" : 
                        "bg-white/10 text-ink"
                      }`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-ink">{tx.asset}</td>
                    <td className="p-3 font-bold text-ink">${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="p-3 pr-4 text-right">
                      <span className={`inline-flex items-center gap-1 text-2xs font-semibold font-subheading ${
                        tx.status === "completed" || tx.status === "approved" ? "text-positive" :
                        tx.status === "pending" ? "text-yellow-400" :
                        tx.status === "rejected" || tx.status === "failed" ? "text-negative" :
                        "text-muted"
                      }`}>
                        {tx.status === "pending" ? <AlertTriangle size={12} /> : tx.status === "rejected" || tx.status === "failed" ? <AlertTriangle size={12} /> : <CheckCircle2 size={12} />}
                        {tx.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.section>

    </motion.div>
  );
};

