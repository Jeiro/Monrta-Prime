import React from 'react';
import { motion } from 'motion/react';
import { Zap, Shield, ShieldCheck, BarChart3, Lock, Globe, Layers, Target, Users, TrendingUp, ThumbsUp, Headset, Database, Puzzle, Fingerprint, Mail } from 'lucide-react';

/*
 * NOTE: superseded by <Proof />, which merged this section with
 * <Confidence />. Nothing imports it today — it is kept because Proof reuses
 * its content. Colours are on the token system so it stays usable.
 *
 * NOT SAFE TO RENDER AS-IS. The `stats` array below still carries the
 * fabricated figures that were removed from <Proof /> — "6,000+ active
 * investors", "$600M+" and "99% client satisfaction" are invented and have
 * nothing behind them. Proof replaced them with capability copy that is true
 * by construction; this file was left alone because choosing its replacement
 * copy is a content decision for a component nobody currently uses. If this
 * is ever wired up, those three tiles must be dealt with first.
 *
 * (The "AS SEEN IN" press strip that also lived here has already been
 * removed — see the comment at the bottom of the render.)
 */

// Section 2: Why Choose (Platform Trust Section redesigned based on User Request with gold orange theme and container-less sleekness)
export const WhyMonetaPrime = () => {
  const stats = [
    { value: "6,000+", label: "Active Investors", icon: Users, colorClass: "text-accent bg-accent/5 border-accent/10" },
    { value: "$600M+", label: "Profits Generated", icon: TrendingUp, colorClass: "text-positive bg-positive/5 border-positive/10" },
    { value: "99%", label: "Client Satisfaction", icon: ThumbsUp, colorClass: "text-accent bg-accent/5 border-accent/10" },
    { value: "24/7", label: "Expert Support", icon: Headset, colorClass: "text-accent bg-accent/5 border-accent/10" }
  ];

  const trustItems = [
    { icon: Lock, title: "SSL Secured", desc: "256-bit Encryption", colorClass: "text-accent bg-accent/5 border-accent/10 fill-accent/10" },
    { icon: Shield, title: "Regulated", desc: "Licensed Platform", colorClass: "text-positive bg-positive/5 border-positive/10 fill-positive/10" },
    { icon: Zap, title: "Fast Withdrawals", desc: "Within 24 Hours", colorClass: "text-accent bg-accent/5 border-accent/10 fill-accent/10" },
    { icon: Globe, title: "Data Privacy", desc: "GDPR Compliant", colorClass: "text-accent bg-accent/5 border-accent/10 fill-accent/10" }
  ];

  return (
    <section className="py-10 px-4 bg-ground/20 border-t border-line/5 overflow-hidden" id="why-moneta-prime">
      <div className="max-w-7xl mx-auto">
        
        {/* Header content with TRUSTED WORLDWIDE badge */}
        <div className="text-center mb-10 space-y-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 80, damping: 15 }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-accent/15 bg-accent/5 text-2xs md:text-xs text-accent font-bold tracking-[0.2em] font-sans uppercase mb-1"
          >
            <Shield className="w-3.5 h-3.5 text-accent fill-accent/10" />
            TRUSTED WORLDWIDE
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0, y: 35 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 60, damping: 14 }}
            className="text-2xl sm:text-3xl md:text-4xl lg:text-4xl font-semibold text-ink tracking-tight leading-tight max-w-4xl mx-auto font-display"
          >
            A Platform Traders Rely On
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 60, damping: 14, delay: 0.1 }}
            className="text-muted max-w-2xl mx-auto text-base md:text-lg leading-relaxed font-sans"
          >
            Backed by Consensys infrastructure, global regulatory compliance, and the trust of thousands of active digital asset investors.
          </motion.p>
        </div>

        {/* Big 4 Stat cards (Container-less, border-less, springing animations on scroll) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 text-center">
          {stats.map((stat, idx) => {
            const StatIcon = stat.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 70, scale: 0.85 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, amount: 0.05 }}
                transition={{ type: "spring", stiffness: 65, damping: 12, delay: idx * 0.08 }}
                className="flex flex-col items-center justify-center p-2 relative group transform-gpu"
              >
                {/* Visual Icon with colorful styling */}
                <div className={`p-3 rounded-2xl border mb-3.5 group-hover:scale-110 transition-transform duration-300 ${stat.colorClass}`}>
                  <StatIcon className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
                
                <div className="font-display font-black text-3xl min-[380px]:text-4xl sm:text-5xl md:text-6xl lg:text-7xl tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-accent to-accent-deep select-none group-hover:scale-105 transition-transform duration-300">
                  {stat.value}
                </div>
                <div className="text-xs sm:text-sm font-bold text-muted tracking-widest uppercase mt-3.5 font-sans">
                  {stat.label}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Mini Trust items below (Container-less, scroll-animated, premium colorful icons) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 mt-10 md:mt-12 border-t border-line/40 pt-8">
          {trustItems.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 60, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, amount: 0.05 }}
              transition={{ type: "spring", stiffness: 70, damping: 13, delay: idx * 0.09 }}
              className="flex items-center gap-4.5 p-2 transform-gpu"
            >
              <div className={`flex-shrink-0 p-3.5 rounded-2xl border hover:scale-110 hover:-rotate-6 transition-all duration-300 ${item.colorClass}`}>
                <item.icon className="w-5.5 h-5.5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-extrabold text-ink text-base font-sans tracking-tight">
                  {item.title}
                </h4>
                <p className="text-muted text-xs sm:text-sm font-sans">
                  {item.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* An "AS SEEN IN" strip naming Bloomberg, Forbes, Reuters, CoinDesk
            and TechCrunch used to sit here. It was removed for the same reason
            as the one in Proof.tsx: naming real publications that never
            covered the platform is a legal exposure, not just a trust one.
            This component is currently unrendered, which is exactly why the
            strip was removed rather than left — it is one import away from
            shipping the claim again. Do not reinstate it. */}

      </div>
    </section>
  );
};

// Section 3: Confidence