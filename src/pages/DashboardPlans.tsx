import React, { useEffect, useMemo, useState } from "react";
import { useSession } from "../context/domains/SessionContext";
import { useInvestmentPlans } from "../context/domains/InvestmentPlansContext";
import { useWallet } from "../context/domains/WalletContext";
import { Layers, Target, Coins, ShieldAlert, Timer, TrendingUp, Activity, Sparkles, Crown, Gem, Award } from "lucide-react";
import { Button, Input } from "../components/ui";

export const DashboardPlans: React.FC = () => {
  const { user } = useSession();
  const { plans, investInPlan, claimPlanPayout } = useInvestmentPlans();
  const { setInsufficientBalanceOpen } = useWallet();
  const enabledPlans = useMemo(() => plans.filter((plan) => plan.enabled && plan.status === "active").sort((a, b) => a.displayOrder - b.displayOrder || a.minDeposit - b.minDeposit), [plans]);
  const [selectedPlanId, setSelectedPlanId] = useState("plan-gold");
  const [investAmountText, setInvestAmountText] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const handleClaimPayout = async (investmentId: string) => {
    setClaimingId(investmentId);
    try {
      await claimPlanPayout(investmentId);
    } finally {
      setClaimingId(null);
    }
  };

  /*
   * EXEMPT FROM THE TOKEN SYSTEM — deliberate, do not "fix".
   *
   * Bronze #a55a29, silver #94a3b8 and gold #eab308 encode a rank/medal
   * system, not an app state. They are read as materials the way an
   * Olympic podium is: substituting accent/muted would erase the ordering
   * the tiers exist to express, and the accent may never encode an outcome
   * in the first place. Same category as ZeroPercentLoopCard's metal
   * gradient and Brandmark's logo colours.
   *
   * Platinum and Diamond deliberately stay on muted/accent — there is no
   * agreed "platinum" or "diamond" hue to be faithful to, so they take
   * palette values rather than an invented one.
   */
  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case "plan-bronze":
        return <Award size={18} className="text-[#a55a29] shrink-0" />;
      case "plan-silver":
        return <Layers size={18} className="text-[#94a3b8] shrink-0" />;
      case "plan-gold":
        return <Crown size={18} className="text-[#eab308] shrink-0" />;
      case "plan-platinum":
        return <Sparkles size={18} className="text-muted shrink-0" />;
      case "plan-diamond":
        return <Gem size={18} className="text-accent shrink-0" />;
      default:
        return <Coins size={18} className="text-accent shrink-0" />;
    }
  };

  const activePlanObj = enabledPlans.find(p => p.id === selectedPlanId) || enabledPlans[0];

  useEffect(() => {
    if (enabledPlans.length && !enabledPlans.some((plan) => plan.id === selectedPlanId)) {
      setSelectedPlanId(enabledPlans[0].id);
    }
  }, [enabledPlans, selectedPlanId]);

  const handleInvestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const amount = parseFloat(investAmountText);
    if (!amount || amount <= 0) {
      setFeedback({ type: "error", message: "Please specify a valid numeric capital amount." });
      return;
    }

    const res = await investInPlan(selectedPlanId, amount);
    if (res.success) {
      setFeedback({ type: "success", message: res.message });
      setInvestAmountText("");
    } else {
      if (res.message.toLowerCase().includes("insufficient") || res.message.toLowerCase().includes("not enough balance")) {
        setInsufficientBalanceOpen(true);
      } else {
        setFeedback({ type: "error", message: res.message });
      }
    }
  };

  if (!activePlanObj) {
    return (
      <div className="bg-surface border border-line rounded-2xl p-8 text-center text-sm text-muted">
        No investment plans are currently available.
      </div>
    );
  }

  // Calculates estimated returns for the input amount
  const projections = useMemo(() => {
    if (!activePlanObj) return null;
    const amt = parseFloat(investAmountText) || 0;
    const profit = amt * (activePlanObj.roiPercent / 100);
    return {
      profit: +profit.toFixed(2),
      total: +(amt + profit).toFixed(2),
      daily: +(profit / activePlanObj.durationDays).toFixed(2)
    };
  }, [activePlanObj, investAmountText]);

  return (
    <div className="space-y-4 pb-4 sm:pb-6 font-sans">
      
      {/* Header title */}
      <div className="border-b border-line/50 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-ink flex items-center gap-2.5">
            <TrendingUp size={24} className="text-accent shrink-0" />
            <span>Investment Plans</span>
          </h1>
          <p className="text-xs text-muted mt-1 font-sans leading-relaxed">
            Choose your plan and target. Select a plan that fits your budget and timeline and start earning daily rewards. Track progress from your dashboard.
          </p>
        </div>
        <div className="bg-surface border border-line rounded-xl py-2 px-4 shrink-0 font-subheading text-xs">
          Available Balance: <strong className="text-accent font-data">${user.balance.toLocaleString()}</strong>
        </div>
      </div>

      {/* Side-by-Side Plan Cards as requested by user */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 font-sans">
        {enabledPlans.map((p) => {
          const isSelected = p.id === selectedPlanId;
          const isPaused = p.status === "paused";
          return (
            <div 
              key={p.id}
              onClick={() => {
                if (!isPaused) {
                  setSelectedPlanId(p.id);
                  setFeedback(null);
                }
              }}
              className={`p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden flex flex-col justify-between h-80 cursor-pointer ${
                isSelected 
                  ? "border-accent bg-accent/5 shadow-lg shadow-accent/10 scale-[1.01]" 
                  : "border-line bg-panel/40 hover:border-accent/40 hover:bg-panel/60"
              } ${isPaused ? "opacity-50 cursor-not-allowed border-negative/10" : ""}`}
            >
              {isSelected && (
                <div className="absolute top-0 right-0 bg-accent text-ground font-black uppercase text-2xs py-1 px-3 rounded-bl-xl tracking-widest font-subheading">
                  Selected
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <div className="inline-flex items-center justify-center bg-accent-deep/10 border border-accent-deep/20 p-1 rounded-md mb-2">
                    <Activity size={13} className="text-accent-deep" />
                  </div>
                  <h3 className="text-base font-extrabold text-ink tracking-tight font-sans mt-0.5 flex items-center gap-2">
                    {getPlanIcon(p.id)}
                    <span>{p.name}</span>
                  </h3>
                  <p className="text-2xs text-muted mt-1.5 leading-normal font-sans line-clamp-2">{p.description}</p>
                </div>

                <div className="space-y-1.5 border-t border-line/50 pt-3">
                  <div className="flex justify-between text-2xs font-sans">
                    <span className="text-muted">Duration:</span>
                    <strong className="text-ink font-bold font-data flex items-center gap-1">
                      <Timer size={10} className="text-accent" />
                      {p.durationDays} Days
                    </strong>
                  </div>
                  <div className="flex justify-between text-2xs font-sans">
                    <span className="text-muted">Deposit:</span>
                    <strong className="text-ink font-bold font-data">
                      ${p.minDeposit.toLocaleString()} - {p.maxDeposit >= 10000000 ? "Unlimited" : `$${p.maxDeposit.toLocaleString()}`}
                    </strong>
                  </div>
                  <div className="flex justify-between text-2xs font-sans">
                    <span className="text-muted">Returns:</span>
                    <strong className="text-positive font-black font-data">
                      +{p.roiPercent}% ROI
                    </strong>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-line/30">
                <Button
                  type="button"
                  block
                  variant={isSelected ? "primary" : "secondary"}
                  disabled={isPaused}
                  aria-pressed={isSelected}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isPaused) {
                      setSelectedPlanId(p.id);
                      setFeedback(null);
                      // NOTE (pre-existing, not introduced by the primitive
                      // conversion): no element in this file has the id
                      // "investAmountInput", so this lookup returns null and
                      // the focus never happens. Left as-is because making it
                      // work is a behaviour change, not a conversion — but it
                      // is dead and should either be wired up or removed.
                      document.getElementById("investAmountInput")?.focus();
                    }
                  }}
                >
                  {isPaused ? "Suspended" : "Invest Now"}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Left column: Selector + Allocation inputs (col-span-7) */}
        <div className="lg:col-span-12 bg-surface border border-line rounded-2xl p-4 space-y-4">
          <h3 className="text-sm font-bold font-sans text-ink border-b border-line/50 pb-3 flex flex-wrap items-center justify-between gap-y-2">
            <span className="flex items-center gap-2">
              <Coins size={16} className="text-accent animate-spin" style={{ animationDuration: "12s" }} />
              <span>Invest to Earn: <span className="text-accent font-sans font-extrabold">{activePlanObj.name}</span></span>
            </span>
            <span className="flex items-center gap-1.5 bg-surface/50 border border-line/40 py-1 px-2.5 rounded-lg text-2xs font-sans font-medium text-muted">
              {getPlanIcon(activePlanObj.id)}
              <span className="text-ink font-semibold">{activePlanObj.name}</span>
            </span>
          </h3>

          <form onSubmit={handleInvestSubmit} className="space-y-4">
            
            {/* Display message logs */}
            {feedback && (
              <div className={`p-4 text-xs rounded-xl border font-sans ${
                feedback.type === "error" ? "bg-negative/10 border-negative/30 text-negative" : "bg-positive/10 border-positive/30 text-positive"
              }`}>
                {feedback.message}
              </div>
            )}

            {/* Selected Plan statistics parameters */}
            <div className="grid grid-cols-3 gap-4 border border-line/70 p-4 bg-panel/35 rounded-xl text-xs font-sans">
              <div className="space-y-1">
                <span className="text-muted text-2xs uppercase tracking-wider block font-sans font-bold">Term</span>
                <strong className="text-ink text-sm font-sans font-extrabold block">{activePlanObj.durationDays} Days</strong>
              </div>
              <div className="space-y-1">
                <span className="text-muted text-2xs uppercase tracking-wider block font-sans font-bold">Min Deposit</span>
                <strong className="text-ink text-sm font-sans font-extrabold block">${activePlanObj.minDeposit.toLocaleString()}</strong>
              </div>
              <div className="space-y-1">
                <span className="text-muted text-2xs uppercase tracking-wider block font-sans font-bold">Max Deposit</span>
                <strong className="text-ink text-sm font-sans font-extrabold block">
                  {activePlanObj.maxDeposit === 10000000 ? "No Limit" : `$${activePlanObj.maxDeposit.toLocaleString()}`}
                </strong>
              </div>
            </div>

            {/* Input Capital mount size */}
            <div className="space-y-2 font-sans">
              <div className="flex justify-between text-2xs uppercase text-muted font-bold font-sans">
                <span>Amount ($)</span>
                <span className="text-muted font-sans font-semibold">Available: ${user.balance.toLocaleString()}</span>
              </div>
              <Input
                type="number"
                required
                numeric
                prefix="$"
                value={investAmountText}
                onChange={(e) => setInvestAmountText(e.target.value)}
                placeholder="Amount to invest"
                aria-label="Amount to invest"
              />
            </div>

            <Button type="submit" block size="lg">Invest</Button>
          </form>
        </div>

        {/* Right column: Estimates + Active allocations status (col-span-5) */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-6">
          
          {/* Projections card */}
          <div className="bg-surface border border-line rounded-xl p-5 space-y-4 font-sans">
            <h4 className="text-xs font-subheading tracking-widest text-accent border-b border-line/50 pb-2 flex items-center justify-between">
              Earnings Projection
              <Target size={14} />
            </h4>

            <div className="space-y-3.5 text-xs text-muted font-sans">
              <div className="flex justify-between items-center bg-ground/40 p-2.5 border border-line/30 rounded-lg">
                <span className="font-subheading">ROI:</span>
                <strong className="text-positive font-bold font-data text-sm">+{activePlanObj.roiPercent}%</strong>
              </div>
              
              <div className="flex justify-between items-center">
                <span>Net Profit:</span>
                <strong className="text-positive font-bold font-data">${projections.profit.toLocaleString()}</strong>
              </div>

              <div className="flex justify-between items-center">
                <span>Daily payout:</span>
                <strong className="text-ink font-semibold font-data">${projections.daily}/day</strong>
              </div>

              <div className="flex justify-between items-center border-t border-line/40 pt-3">
                <span className="text-ink font-subheading">Total return:</span>
                <strong className="text-base text-ink font-bold font-data">${projections.total.toLocaleString()}</strong>
              </div>
            </div>
          </div>

          {/* Active stats listings summary wrapper */}
          <div className="bg-gradient-to-br from-panel to-surface border border-line rounded-xl p-5 space-y-4 flex-1">
            <h4 className="text-xs font-bold font-heading text-ink border-b border-line/60 pb-2 flex items-center justify-between">
              My Active Plans
              <Timer className="text-accent" size={14} />
            </h4>

            {user.activeInvestments.length === 0 ? (
              <p className="text-xs text-center text-muted py-12 font-sans">No active plans. Select a plan to start earning.</p>
            ) : (
              <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1 font-sans">
                {user.activeInvestments.map((inv) => {
                  const isMaturedComplete = inv.status === "Completed" || inv.status === "completed";
                  const isPaid = isMaturedComplete && Boolean(inv.payoutTransactionId);
                  const isClaimable = isMaturedComplete && !inv.payoutTransactionId;
                  const isClaiming = claimingId === inv.id;
                  const expectedProfit = inv.expectedProfit ?? inv.accumulatedProfit;
                  const totalReturn = inv.totalReturn ?? inv.amount + expectedProfit;
                  const remainingDays = inv.remainingDays ?? 0;
                  return (
                    <div 
                      key={inv.id}
                      className="p-3.5 border border-line bg-ground/50 rounded-xl space-y-2 text-xs"
                    >
                      <div className="flex justify-between font-bold text-ink font-sans">
                        <span>{inv.name}</span>
                        <span className="text-positive font-data">
                          +${(isMaturedComplete ? expectedProfit : inv.accumulatedProfit).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      <div className="w-full bg-line h-1 rounded-full overflow-hidden">
                        <div 
                          className="bg-accent h-full"
                          style={{ width: `${inv.progress}%` }}
                        />
                      </div>

                      <div className="flex justify-between text-2xs text-muted font-data">
                        <span>Funded: ${inv.amount.toLocaleString()}</span>
                        <span className="font-subheading">{isPaid ? "Completed" : isClaimable ? "Matured" : `${remainingDays}d left`}</span>
                      </div>
                      {isClaimable && (
                        <Button
                          type="button"
                          variant="positive"
                          size="sm"
                          block
                          className="mt-1"
                          loading={isClaiming}
                          onClick={() => handleClaimPayout(inv.id)}
                        >
                          {`Claim Payout $${totalReturn.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                        </Button>
                      )}
                      {isPaid && (
                        <div className="w-full bg-positive/10 border border-positive/30 text-positive font-bold font-subheading py-1.5 rounded text-center uppercase text-2xs mt-1">
                          Paid ${totalReturn.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Safety regulations disclosures */}
      <section className="p-4 border border-line rounded-xl bg-surface/45 flex gap-3 text-xs leading-relaxed text-muted font-sans">
        <ShieldAlert size={18} className="text-accent shrink-0 mt-0.5 animate-bounce" />
        <div>
          <strong className="text-ink font-subheading block mb-0.5">Earn risk disclaimer:</strong>
          Earnings are distributed directly to your wallet upon plan maturity. Capital is secure but subject to standard period locks.
        </div>
      </section>

    </div>
  );
};




