import React, { useEffect, useMemo, useState } from "react";
import { useSeo } from "../lib/useSeo";
import { useSession } from "../context/domains/SessionContext";
import { useInvestmentPlans } from "../context/domains/InvestmentPlansContext";
import { useSiteSettings } from "../context/domains/SiteSettingsContext";
import { Check, Info, ArrowRight, ShieldCheck, DollarSign, HelpCircle, Clock, TrendingUp, Award, Layers, Crown, Sparkles, Gem, Activity, ChevronDown } from "lucide-react";

interface PublicPlansProps {
  onNavigate: (view: string) => void;
}

export const PublicPlans: React.FC<PublicPlansProps> = ({ onNavigate }) => {
  useSeo({
    title: "Investment Plans — Tiered Yields & Returns | Moneta Prime",
    description: "Explore Moneta Prime investment plans across Bronze to Diamond tiers. Compare yields, durations, and expected returns, then start earning.",
    path: "/plans",
  });
  const { user } = useSession();
  const { plans } = useInvestmentPlans();
  const { siteContent } = useSiteSettings();
  const enabledPlans = useMemo(() => plans.filter((plan) => plan.enabled && plan.status === "active").sort((a, b) => a.displayOrder - b.displayOrder || a.minDeposit - b.minDeposit), [plans]);

  // Calculator States
  const [selectedCalcPlan, setSelectedCalcPlan] = useState("plan-gold");
  const [calcAmount, setCalcAmount] = useState(5000);

  const activeCalcPlanObj = enabledPlans.find(p => p.id === selectedCalcPlan) || enabledPlans[0];

  useEffect(() => {
    if (enabledPlans.length && !enabledPlans.some((plan) => plan.id === selectedCalcPlan)) {
      setSelectedCalcPlan(enabledPlans[0].id);
      setCalcAmount(enabledPlans[0].minDeposit);
    }
  }, [enabledPlans, selectedCalcPlan]);

  if (!activeCalcPlanObj) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20">
        <div className="bg-surface border border-line rounded-2xl p-8 text-center text-sm text-muted">
          No investment plans are currently available.
        </div>
      </div>
    );
  }

  // Restrict calc amount to min/max of current plan
  const handleAmountChange = (val: number) => {
    setCalcAmount(val);
  };

  const calculateReturn = () => {
    const profit = calcAmount * (activeCalcPlanObj.roiPercent / 100);
    const total = calcAmount + profit;
    const daily = profit / activeCalcPlanObj.durationDays;
    return {
      profit: +profit.toFixed(2),
      total: +total.toFixed(2),
      daily: +daily.toFixed(2)
    };
  };

  const result = calculateReturn();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-16 pb-20">

      {/* Page Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="text-xs font-subheading text-accent uppercase tracking-widest bg-accent/15 px-3 py-1 rounded-full">
          Investment Plans
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold font-heading text-ink tracking-tight">
          {siteContent?.investment_title || "Choose your plan and target"}
        </h1>
        <p className="text-sm text-muted leading-relaxed font-sans">
          {siteContent?.investment_description || "Select a plan that fits your budget and timeline. Track progress from your dashboard."}
        </p>
      </div>

      {/* Main tiered selector cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {enabledPlans.map((plan) => {

          const getPlanHeaderIcon = (planId: string) => {
            switch (planId) {
              case "plan-bronze":
                return <Award size={18} className="text-accent shrink-0" />;
              case "plan-silver":
                return <Layers size={18} className="text-accent shrink-0" />;
              case "plan-gold":
                return <Crown size={18} className="text-accent shrink-0" />;
              case "plan-platinum":
                return <Sparkles size={18} className="text-accent shrink-0" />;
              case "plan-diamond":
                return <Gem size={18} className="text-accent shrink-0" />;
              default:
                return <Activity size={18} className="text-accent shrink-0" />;
            }
          };

          const getSliderWidth = (planId: string) => {
            switch (planId) {
              case "plan-bronze": return "30%";
              case "plan-silver": return "45%";
              case "plan-gold": return "60%";
              case "plan-platinum": return "75%";
              case "plan-diamond": return "90%";
              default: return "50%";
            }
          };

          return (
            <div
              key={plan.id}
              className="bg-surface border border-line rounded-2xl p-6 relative overflow-hidden transition-all flex flex-col justify-between hover:scale-[1.01] hover:border-accent/40 shadow-xl"
            >
              {plan.badge && (
                <div className="absolute top-0 right-0 bg-accent text-ground text-2xs uppercase font-subheading tracking-wider font-bold px-3 py-1 rounded-bl-lg">
                  {plan.badge}
                </div>
              )}

              {/* Top info */}
              <div>
                {/* 1. Box with a mini activity pulse icon */}
                <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-4">
                  <Activity size={18} className="text-accent" />
                </div>

                {/* 2. Header and Icon */}
                <h3 className="text-base font-extrabold font-heading text-ink mt-1 flex items-center gap-2">
                  {getPlanHeaderIcon(plan.id)}
                  <span>{plan.name}</span>
                </h3>

                <p className="text-xs text-muted leading-relaxed font-sans mt-3 mb-6 min-h-[64px]">
                  {plan.description}
                </p>

                {/* Divider Line */}
                <div className="border-t border-line/50 my-4" />

                {/* Key attributes lists */}
                <div className="space-y-3.5 text-xs font-sans">
                  <div className="flex items-center justify-between">
                    <span className="text-muted">Duration:</span>
                    <strong className="text-ink font-data font-bold flex items-center gap-1">
                      <Clock size={11} className="text-accent" />
                      {plan.durationDays} Days
                    </strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted">Deposit:</span>
                    <strong className="text-ink font-data font-bold">
                      ${plan.minDeposit.toLocaleString()} - {plan.maxDeposit >= 10000000 ? "Unlimited" : `$${plan.maxDeposit.toLocaleString()}`}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted">Returns:</span>
                    <strong className="text-positive font-extrabold font-data text-sm">
                      +{plan.roiPercent}% ROI
                    </strong>
                  </div>
                </div>

                {/* Visual slider decoration exactly as in image 2 */}
                <div className="relative mt-5 mb-2 h-1 bg-line/40 rounded-full overflow-visible">
                  <div className="absolute top-0 left-0 h-full bg-accent rounded-full" style={{ width: getSliderWidth(plan.id) }} />
                  <div className="absolute w-2.5 h-2.5 bg-accent rounded-full -top-[3px] shadow shadow-accent/50" style={{ left: getSliderWidth(plan.id) }} />
                </div>
              </div>

              <button
                onClick={() => user.isLoggedIn ? onNavigate("dashboard-plans") : onNavigate("auth")}
                className="w-full py-3 mt-6 rounded-xl font-bold font-subheading text-xs tracking-wider uppercase transition-all bg-panel hover:bg-accent border border-line hover:border-accent text-ink hover:text-ground cursor-pointer shadow-sm text-center"
              >
                INVEST NOW
              </button>

            </div>
          );
        })}
      </div>

      {/* INVESTMENT CALCULATOR SIMULATOR SCREEN */}
      <section className="p-6 sm:p-8 relative bg-transparent border-none shadow-none">
        <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-accent/5 rounded-full blur-[60px]" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">

          {/* Left Calculator Panel Inputs */}
          <div className="lg:col-span-7 space-y-6 font-sans">
            <div>
              <span className="text-accent text-2xs font-subheading tracking-widest uppercase">
                INVESTMENT SIMULATOR
              </span>
              <h2 className="text-xl sm:text-2xl font-bold font-heading text-ink mt-1">
                Project Your Investment Growth
              </h2>
              <p className="text-xs text-muted mt-1 font-sans">
                Model capital accruals and select maturity targets dynamically before allocating active funds.
              </p>
            </div>

            {/* Select Tier selectors */}
            <div className="space-y-2">
              <label className="text-2xs text-muted uppercase font-subheading tracking-wider">
                Select Desired Plan Tier
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {enabledPlans.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setSelectedCalcPlan(p.id);
                      setCalcAmount(p.minDeposit);
                    }}
                    className={`p-3 rounded-lg border text-center text-xs font-semibold font-subheading cursor-pointer transition-all ${selectedCalcPlan === p.id
                        ? "border-accent bg-accent/10 text-accent shadow"
                        : "border-line/80 bg-ground text-muted"
                      }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Capital Amount */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-2xs text-muted font-subheading tracking-wider">
                <span>Investment Amount</span>
                <span>
                  Limits: ${activeCalcPlanObj.minDeposit.toLocaleString()} - {activeCalcPlanObj.maxDeposit === 1000000 ? "Unlimited" : `$${activeCalcPlanObj.maxDeposit.toLocaleString()}`}
                </span>
              </div>

              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted font-data text-sm">
                  $
                </span>
                <input
                  type="number"
                  value={calcAmount}
                  onChange={(e) => handleAmountChange(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-ground border border-line focus:border-accent rounded-xl pl-8 pr-4 py-3 text-sm font-data text-ink font-bold"
                />
              </div>

              {/* Slider track scale */}
              <input
                type="range"
                min={activeCalcPlanObj.minDeposit}
                max={activeCalcPlanObj.maxDeposit === 1000000 ? 50000 : activeCalcPlanObj.maxDeposit}
                step={activeCalcPlanObj.minDeposit <= 100 ? 50 : 100}
                value={calcAmount}
                onChange={(e) => handleAmountChange(parseInt(e.target.value))}
                className="w-full h-1.5 bg-ground rounded-lg appearance-none cursor-pointer accent-accent"
              />
            </div>
          </div>

          {/* Right Calculator Projections Panel */}
          <div className="lg:col-span-5 rounded-xl p-6 space-y-5 font-sans bg-transparent border-none shadow-none">
            <h3 className="text-xs font-subheading text-accent pb-3 flex items-center gap-2">
              <ShieldCheck size={14} className="text-positive shrink-0" />
              <span>Estimated Earnings</span>
            </h3>

            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted">Principal Investment:</span>
                <span className="font-data text-ink font-bold">${calcAmount.toLocaleString()}</span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-muted">Expected ROI:</span>
                <span className="font-data text-positive font-bold">+{activeCalcPlanObj.roiPercent}%</span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-muted">Lockup Period:</span>
                <span className="font-data text-ink font-bold">{activeCalcPlanObj.durationDays} Days</span>
              </div>

              <div className="flex justify-between items-center text-xs pb-4">
                <span className="text-muted">Estimated Average daily yield:</span>
                <span className="font-data text-accent font-bold">${result.daily}/day</span>
              </div>

              {/* Final totals */}
              <div className="pt-2">
                <span className="text-2xs text-muted block font-subheading">Total Net Profit</span>
                <span className="text-2xl font-black font-data text-positive">
                  +${result.profit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div>
                <span className="text-2xs text-muted block font-subheading">Total Payout</span>
                <span className="text-xl font-bold font-data text-ink">
                  ${result.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <button
              onClick={() => user.isLoggedIn ? onNavigate("dashboard-plans") : onNavigate("auth")}
              className="w-full mt-4 py-3 rounded-lg bg-gradient-to-r from-accent to-accent-deep text-ground font-bold font-subheading text-xs tracking-wider uppercase shadow-md shadow-accent/15 cursor-pointer text-center"
            >
              Invest Now
            </button>
          </div>

        </div>
      </section>

      {/* FAQ supplemental */}
      <section className="max-w-3xl mx-auto space-y-6 pt-6">
        <h3 className="text-sm font-sans font-extrabold text-accent uppercase tracking-widest flex items-center justify-center gap-2">
          <ShieldCheck size={16} className="text-accent" />
          <span>Safety & Settlement FAQ</span>
        </h3>

        <div className="space-y-4">
          {siteContent?.faq_question_1 && (
            <div className="p-4 rounded-xl border border-line/40 bg-surface/45 text-xs">
              <h4 className="font-semibold text-ink flex items-center justify-between gap-4 cursor-pointer hover:text-accent transition-colors">
                <span>{siteContent.faq_question_1}</span>
                <ChevronDown size={14} className="text-muted/50 shrink-0" />
              </h4>
              <p className="text-muted mt-2 leading-relaxed">
                {siteContent.faq_answer_1}
              </p>
            </div>
          )}

          {siteContent?.faq_question_2 && (
            <div className="p-4 rounded-xl border border-line/40 bg-surface/45 text-xs">
              <h4 className="font-semibold text-ink flex items-center justify-between gap-4 cursor-pointer hover:text-accent transition-colors">
                <span>{siteContent.faq_question_2}</span>
                <ChevronDown size={14} className="text-muted/50 shrink-0" />
              </h4>
              <p className="text-muted mt-2 leading-relaxed">
                {siteContent.faq_answer_2}
              </p>
            </div>
          )}

          {siteContent?.faq_question_3 && (
            <div className="p-4 rounded-xl border border-line/40 bg-surface/45 text-xs">
              <h4 className="font-semibold text-ink flex items-center justify-between gap-4 cursor-pointer hover:text-accent transition-colors">
                <span>{siteContent.faq_question_3}</span>
                <ChevronDown size={14} className="text-muted/50 shrink-0" />
              </h4>
              <p className="text-muted mt-2 leading-relaxed">
                {siteContent.faq_answer_3}
              </p>
            </div>
          )}
        </div>
      </section>

    </div>
  );
};


