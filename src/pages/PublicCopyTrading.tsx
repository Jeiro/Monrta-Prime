import React, { useState } from "react";
import { useSeo } from "../lib/useSeo";
import { useSession } from "../context/domains/SessionContext";
import { useTraders } from "../context/domains/TradersContext";
import { useWallet } from "../context/domains/WalletContext";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";
import { Avatar } from "../components/ui";
import { UserCheck, Users, TrendingUp, ShieldAlert, Award, ArrowUpRight, CheckCircle2, Calendar, X, DollarSign, Wallet, ShieldCheck, Info, Loader2 } from "lucide-react";

interface PublicCopyTradingProps {
  onNavigate: (view: string) => void;
}

export const PublicCopyTrading: React.FC<PublicCopyTradingProps> = ({ onNavigate }) => {
  useSeo({
    title: "Copy Trading — Follow Top Traders | Moneta Prime",
    description: "Automatically mirror the strategies of proven traders on Moneta Prime. Browse verified performance, allocate funds, and copy trades in real time.",
    path: "/copy-trading",
  });
  const { user } = useSession();
  const { traders, copyTrader } = useTraders();
  const { setInsufficientBalanceOpen } = useWallet();
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [allocatingTrader, setAllocatingTrader] = useState<any | null>(null);
  useBodyScrollLock(Boolean(allocatingTrader));
  const [allocateAmt, setAllocateAmt] = useState("");
  const [allocateLoading, setAllocateLoading] = useState(false);

  const activeCopiedIds = user.copyTrades
    .filter(trade => trade.status === "Running")
    .map(trade => trade.traderId);

  const handleCopyClick = (traderId: string, traderName: string) => {
    if (!user.isLoggedIn) {
      onNavigate("auth");
      return;
    }

    if (activeCopiedIds.includes(traderId)) {
      triggerFeedback(`You are already copying ${traderName}.`);
    } else {
      const selected = traders.find(t => t.id === traderId);
      if (selected) {
        setAllocatingTrader(selected);
        setAllocateAmt(String(selected.minimumCopyAmount ?? 500));
      }
    }
  };

  const handleAllocateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (allocateLoading || !allocatingTrader) return;

    const amt = parseFloat(allocateAmt);
    if (isNaN(amt) || amt <= 0) {
      triggerFeedback("Please specify a valid numeric investment amount greater than zero.");
      return;
    }

    if (allocatingTrader.minimumCopyAmount && amt < allocatingTrader.minimumCopyAmount) {
      triggerFeedback(`Minimum copy amount for ${allocatingTrader.name} is $${allocatingTrader.minimumCopyAmount.toLocaleString()}.`);
      return;
    }

    if (allocatingTrader.maximumCopyAmount && amt > allocatingTrader.maximumCopyAmount) {
      triggerFeedback(`Maximum copy amount for ${allocatingTrader.name} is $${allocatingTrader.maximumCopyAmount.toLocaleString()}.`);
      return;
    }

    if (amt > user.balance) {
      setAllocatingTrader(null);
      setInsufficientBalanceOpen(true);
      onNavigate("dashboard-wallet");
      return;
    }

    setAllocateLoading(true);

    setTimeout(async () => {
      const res = await copyTrader(allocatingTrader.id, amt);
      setAllocateLoading(false);

      if (res.success) {
        triggerFeedback(`Successfully linked $${amt} mirror allocation to ${allocatingTrader.name}!`);
        setAllocatingTrader(null);
        setAllocateAmt("");
      } else if (res.message === "INSUFFICIENT_BALANCE") {
        setAllocatingTrader(null);
        setInsufficientBalanceOpen(true);
        onNavigate("dashboard-wallet");
      } else {
        triggerFeedback(res.message);
      }
    }, 1200);
  };

  const triggerFeedback = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 6000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-12 pb-20">
      
      {/* Header Banner */}
      <div className="relative rounded-2xl py-6 overflow-hidden bg-transparent border-none shadow-none">
        <div className="absolute top-0 right-0 w-[400px] h-[200px] bg-accent/5 rounded-full blur-[80px]" />
        
        <div className="w-full max-w-full space-y-4 relative z-10">
          <div className="inline-flex items-center gap-1.5 bg-accent/15 border border-accent/30 text-accent px-3 py-1 rounded-full text-2xs font-subheading tracking-widest uppercase">
            ⚡ REAL-TIME TRADING ENGINE
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold font-heading text-ink tracking-tight">
            Master Copy Trading
          </h1>
          <p className="text-sm text-muted leading-relaxed font-sans">
            Automatically follow the trades of seasoned market experts. Choose your allocation, track performance with 100% transparency, and replicate elite positions with 0% hidden fees.
          </p>
        </div>
      </div>

      {/* Floating Alert Messages */}
      {successMsg && (
        <div className="p-4 rounded-xl border border-accent/40 bg-accent/10 text-ink text-xs z-50 fixed bottom-24 left-6 flex items-center gap-3 w-80 shadow-2xl animate-bounce">
          <CheckCircle2 size={16} className="text-accent shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Roster list */}
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold font-heading text-ink flex items-center gap-2">
            <TrendingUp size={20} className="text-accent shrink-0" />
            Top Traders
          </h2>
          <p className="text-xs text-muted mt-1 font-sans">Real-time stats of top traders.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-sans">
          {traders.map((trader) => {
            const isCopying = activeCopiedIds.includes(trader.id);
            return (
              <div 
                key={trader.id}
                className="p-6 sm:p-8 rounded-2xl transition-all flex flex-col justify-between hover:scale-[1.01] bg-transparent border-none shadow-none"
              >
                
                {/* Header Profile Info */}
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar src={trader.avatar} name={trader.name} size="lg" />
                      <div>
                        <h3 className="text-base font-bold font-subheading text-ink flex items-center gap-2">
                          {trader.name}
                          {(trader.winRate >= 90 || trader.roi >= 150) && (
                            <span className="text-2xs bg-positive/10 text-positive font-subheading px-2 py-0.5 rounded-full flex items-center gap-0.5 select-none">
                              <Award size={10} /> ELITE
                            </span>
                          )}
                        </h3>
                        <p className="text-xs text-muted font-sans flex items-center gap-1.5 mt-0.5">
                          <Calendar size={12} className="text-muted shrink-0" />
                          Number of Days: {trader.profitDays}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-2xs text-muted uppercase font-subheading block select-none">Total AUM</span>
                      <strong className="text-sm font-mono text-accent font-bold">{trader.assetsUnderManagement}</strong>
                    </div>
                  </div>

                  {/* Core ROI stats grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-2 my-6 text-center">
                    <div>
                      <span className="block text-2xs text-muted uppercase font-subheading select-none">Target ROI</span>
                      <span className="text-sm font-bold font-mono text-positive">{typeof trader.roi === 'number' ? trader.roi.toLocaleString() : trader.roi}%</span>
                    </div>
                    <div>
                      <span className="block text-2xs text-muted uppercase font-subheading select-none">Duration</span>
                      <span className="text-sm font-bold font-mono text-accent">{trader.profitDays ?? 30} Days</span>
                    </div>
                    <div>
                      <span className="block text-2xs text-muted uppercase font-subheading select-none">Win Rate</span>
                      <span className="text-sm font-bold font-mono text-ink">{trader.winRate}%</span>
                    </div>
                    <div>
                      <span className="block text-2xs text-muted uppercase font-subheading select-none mb-1">Risk</span>
                      <div className="flex justify-center">
                        <span className={`px-2 py-0.5 rounded-full text-2xs font-bold font-mono border select-none ${
                          trader.riskScore <= 2 
                            ? "bg-positive/10 border-positive/20 text-positive" 
                            : trader.riskScore === 3 
                              ? "bg-warning-soft border-warning-line text-warning" 
                              : "bg-negative/10 border-negative/20 text-negative"
                        }`}>
                          Lv {trader.riskScore}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ROI Chart Trend Plot */}
                  <div className="space-y-2 mb-6">
                    <div className="flex justify-between text-2xs text-muted">
                      <span className="font-subheading select-none">7D ROI Trend</span>
                      <span className="text-positive text-2xs font-subheading font-bold flex items-center select-none">
                        <ArrowUpRight size={12} /> Steady gains
                      </span>
                    </div>
                    <div className="h-16 w-full p-1.5 font-sans">
                      <svg className="w-full h-full" viewBox="0 0 100 30" preserveAspectRatio="none">
                        <polyline
                          fill="none"
                          stroke="var(--color-positive)"
                          strokeWidth="2"
                          points={(() => {
                            const chartPoints = Array.isArray(trader.chartData) && trader.chartData.length > 0 ? trader.chartData : [10, 20, 15, 30, 25, 45];
                            const min = Math.min(...chartPoints);
                            const max = Math.max(...chartPoints);
                            const range = max - min || 1;
                            return chartPoints.map((val, idx) => {
                              const x = (idx / (chartPoints.length - 1)) * 100;
                              const y = 30 - ((val - min) / range) * 23 - 3;
                              return `${x},${y}`;
                            }).join(" ");
                          })()}
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Follower Stats & Master CTA */}
                <div className="flex items-center justify-between gap-4 pt-4 border-t border-line/30 mt-auto font-sans">
                  <div className="flex items-center gap-1.5 text-xs text-muted shrink-0 select-none">
                    <Users size={14} className="text-accent" />
                    <span>Followers:</span>
                    <strong className="font-mono text-ink font-semibold">
                      {trader.followers} / {trader.maxFollowers}
                    </strong>
                  </div>

                  <button
                    onClick={() => handleCopyClick(trader.id, trader.name)}
                    disabled={isCopying}
                    className={`px-6 py-2 rounded-lg font-bold font-subheading text-xs transition-all transform hover:-translate-y-0.5 cursor-pointer select-none ${
                      isCopying 
                        ? "bg-line/50 text-muted cursor-not-allowed hover:translate-y-0" 
                        : "bg-accent text-ground hover:opacity-90 shadow-lg shadow-accent/5"
                    }`}
                  >
                    {isCopying ? "Copied" : "Copy"}
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      </div>

      {/* Copy trading risk disclosure */}
      <div className="p-5 flex gap-3 text-xs leading-relaxed text-muted font-sans bg-transparent border-none shadow-none">
        <ShieldAlert size={18} className="text-warning shrink-0 mt-0.5" />
        <div>
          <strong className="text-ink block mb-0.5 font-subheading font-bold">Risk Warning:</strong>
          Copy trading carries risk. Past performance does not guarantee future results. Manage your investment sizes carefully (we recommend allocating no more than 30% of your account balance to a single trader).
        </div>
      </div>

      {/* Allocation Configuration Modal */}
      {allocatingTrader && (
        <div className="fixed inset-0 bg-ground/75 backdrop-blur-sm z-[150] flex items-center justify-center p-4 animate-fade-in text-left">
          <div className="bg-surface border border-line rounded-2xl w-full max-w-md p-6 relative shadow-2xl space-y-5">
            <button 
              onClick={() => { setAllocatingTrader(null); setAllocateAmt(""); }}
              className="absolute top-4 right-4 text-muted hover:text-ink cursor-pointer bg-transparent border-none outline-none"
            >
              <X size={18} />
            </button>

            <div>
              <h3 className="text-base font-bold text-ink flex items-center gap-2">
                <ShieldCheck size={18} className="text-accent shrink-0" />
                Copy Trader: {allocatingTrader.name}
              </h3>
              <p className="text-xs text-muted mt-1 leading-relaxed font-sans">
                Establish mirror allocations parameters for your profile to seamlessly copy master positions of {allocatingTrader.name}.
              </p>
            </div>

            <form onSubmit={handleAllocateSubmit} className="space-y-4">
              <div className="space-y-1.5 font-sans">
                <div className="flex justify-between items-center text-xs text-muted">
                  <span>Enter Allocation Size (USD)</span>
                  <span className="flex items-center gap-1">
                    <Wallet size={12} className="text-accent shrink-0" />
                    Available: ${user.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint text-xs font-mono font-bold">$</span>
                  <input
                    type="number"
                    value={allocateAmt}
                    onChange={(e) => setAllocateAmt(e.target.value)}
                    placeholder="Enter investment amount"
                    min={allocatingTrader.minimumCopyAmount ?? 10}
                    step="any"
                    required
                    className="w-full bg-surface border border-line/80 focus:border-accent focus:ring-1 focus:ring-accent rounded-xl py-2.5 pl-8 pr-4 text-xs text-ink font-mono font-extrabold outline-none"
                  />
                </div>
              </div>

              <div className="p-3 text-2xs leading-relaxed text-muted bg-surface/50 border border-line/30 rounded-xl flex items-start gap-2.5">
                <Info size={14} className="text-accent shrink-0 mt-0.5" />
                <span>
                  Copy range: ${(allocatingTrader.minimumCopyAmount ?? 10).toLocaleString()} - {allocatingTrader.maximumCopyAmount ? `$${allocatingTrader.maximumCopyAmount.toLocaleString()}` : "No max"}. ROI is locked at confirmation and paid from the stored total return at maturity.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setAllocatingTrader(null); setAllocateAmt(""); }}
                  className="py-2.5 rounded-xl border border-line/50 hover:border-ink bg-transparent text-ink font-bold font-subheading text-2xs uppercase transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={allocateLoading}
                  className="py-2.5 rounded-xl bg-accent text-ground hover:opacity-95 font-extrabold font-subheading text-2xs uppercase transition-all shadow-md shadow-accent/15 cursor-pointer flex justify-center items-center gap-2 leading-relaxed disabled:opacity-50"
                >
                  {allocateLoading ? (
                    <>
                      <Loader2 size={12} className="animate-spin inline-block mr-1" />
                      Allocating...
                    </>
                  ) : "Confirm Allocation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

