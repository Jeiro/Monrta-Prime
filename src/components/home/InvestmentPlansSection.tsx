import React from 'react';
import { motion } from 'motion/react';
import { Zap, Shield, ShieldCheck, BarChart3, Lock, Globe, Layers, Target, Users, TrendingUp, ThumbsUp, Headset, Database, Puzzle, Fingerprint, Mail, Sparkles } from 'lucide-react';
import { useSession } from "../../context/domains/SessionContext";
import { useInvestmentPlans } from "../../context/domains/InvestmentPlansContext";

// Investment Plans Section (matching reference image precisely with floating transparent cards, gold-orange theme, and scroll entrance effects)
export const InvestmentPlansSection = ({ onNavigate }: { onNavigate: (view: string) => void }) => {
  const { user } = useSession();
  const { plans } = useInvestmentPlans();
  const plansList = plans
    .filter((plan) => plan.enabled && plan.status === "active")
    .sort((a, b) => a.displayOrder - b.displayOrder || a.minDeposit - b.minDeposit)
    .map((plan, index) => {
      const icons = [Sparkles, Shield, Layers, Zap, Target];
      const color = plan.accentColor || "#6AA5FF";
      return {
        ...plan,
        icon: icons[index % icons.length],
        colorClass: "",
        glowClass: "via-accent-hover/30",
        color
      };
    });

  return (
    <section className="py-16 px-4 bg-ground/30 border-t border-line/10 relative overflow-hidden" id="investment-plans">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/[0.03] blur-[150px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Header section with INVESTMENT PLANS badge */}
        <div className="text-center mb-10 space-y-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 80, damping: 15 }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-accent/15 bg-accent/5 text-2xs md:text-xs text-accent font-bold tracking-[0.2em] font-sans uppercase mb-1"
          >
            <Layers className="w-3.5 h-3.5 text-accent fill-accent/10" />
            INVESTMENT PLANS
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0, y: 35 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 60, damping: 14 }}
            className="text-2xl sm:text-3xl md:text-4xl lg:text-4xl font-semibold text-ink tracking-tight leading-tight max-w-4xl mx-auto font-display"
          >
            Choose your plan and target
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 60, damping: 14, delay: 0.1 }}
            className="text-muted max-w-2xl mx-auto text-xs sm:text-sm leading-relaxed font-sans"
          >
            Select a plan that fits your budget and timeline. Track progress from your dashboard.
          </motion.p>
        </div>

        {/* Horizontal grid with floating animated cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 md:gap-8">
          {plansList.map((plan, idx) => {
            const PlanIcon = plan.icon;
            return (
              <motion.div
                key={idx}
                custom={idx}
                initial={{ opacity: 0, y: 70, scale: 0.92 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, amount: 0.05 }}
                transition={{ type: "spring", stiffness: 65, damping: 13, delay: idx * 0.08 }}
                className={`bg-raised/15 backdrop-blur-md border border-line/30 rounded-3xl p-6 flex flex-col justify-between text-left shadow-2xl relative group transition-all duration-300 hover:scale-[1.02] hover:border-white/10 transform-gpu min-h-[300px]`}
              >
                <div className="absolute inset-0 bg-gradient-to-b from-white/[0.005] to-transparent rounded-3xl pointer-events-none" />
                
                <div className="space-y-6 relative z-10">
                  {/* Tier icon. Deliberately neutral: this used to take its
                      colour from plan.accentColor, which rendered five
                      different hues across the row and competed with the one
                      accent. The ROI figure carries the emphasis instead. */}
                  <div className="w-10 h-10 rounded-lg border border-line bg-panel text-muted flex items-center justify-center transition-colors duration-300 group-hover:text-accent group-hover:border-accent-line">
                    <PlanIcon className="w-5 h-5" />
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-ink tracking-[0.08em] font-sans uppercase">
                      {plan.name}
                    </h3>
                    
                    <div className="space-y-2">
                      <p className="text-muted font-sans text-xs leading-relaxed line-clamp-2">
                        {plan.description}
                      </p>
                      <p className="text-muted font-sans text-xs leading-relaxed">
                        Expected return: <span className="font-semibold text-ink">{plan.roiPercent}%</span>
                      </p>
                      <p className="text-faint font-sans text-2xs leading-relaxed">
                        Min: ${plan.minDeposit.toLocaleString()} | Max: {plan.maxDeposit >= 10000000 ? "Unlimited" : `${plan.maxDeposit.toLocaleString()}`}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 border-t border-line/40 pt-4 relative z-10">
                  <p className="text-muted font-sans text-xs">
                    Duration: <span className="font-semibold text-ink">{plan.durationDays} Days</span>
                  </p>
                  <button
                    onClick={() => {
                      if (user?.isLoggedIn) {
                        onNavigate('dashboard');
                      } else {
                        onNavigate('auth');
                      }
                    }}
                    className="mt-4 w-full bg-accent hover:bg-accent-hover text-black font-bold text-xs py-2 rounded-lg transition-colors"
                  >
                    Invest Now
                  </button>
                </div>

                {/* Bottom accent glow */}
                <div className={`absolute bottom-0 left-6 right-6 h-[1.5px] bg-gradient-to-r from-transparent ${plan.glowClass} to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500`} />
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

// Section 2: Why Choose (Platform Trust Section redesigned based on User Request with gold orange theme and container-less sleekness)
