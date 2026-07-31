import React from 'react';
import { motion } from 'motion/react';
import { Zap, Shield, ShieldCheck, BarChart3, Lock, Globe, Layers, Target, Users, TrendingUp, ThumbsUp, Headset, Database, Puzzle, Fingerprint, Mail } from 'lucide-react';
import { useApp } from '../../context/AppContext';

// Section 3: Confidence
export const Confidence = () => (
    <section className="py-10 px-4 bg-gradient-to-b from-ground/80 to-black relative overflow-hidden" id="confidence">
      {/* Absolute positioned huge dimming security icon behind */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none z-0">
        <Shield className="w-[320px] h-[320px] sm:w-[450px] sm:h-[450px] md:w-[580px] md:h-[580px] text-accent/[0.025] animate-pulse" style={{ animationDuration: '6s' }} />
      </div>

      <div className="max-w-4xl mx-auto text-center relative z-10">
           <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent/10 border border-accent/30 text-accent mb-4 shadow-[0_0_15px_rgba(106,165,255,0.15)]">
             <ShieldCheck className="w-6 h-6 animate-pulse" style={{ animationDuration: '3s' }} />
           </div>
           <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-[40px] font-semibold text-white tracking-tight leading-tight mb-4 font-display">Trade With Confidence</h2>
           <p className="text-neutral-400 text-sm sm:text-base max-w-xl mx-auto mb-10">Security and transparency are at the center of everything we build.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              {[ { title: "Account Security", desc: "Advanced authentication and encryption technologies keep your account protected.", icon: Fingerprint, colorClass: "text-indigo-400 hover:border-indigo-500/20" },
                 { title: "Transparent Transactions", desc: "Monitor your balances and transaction history anytime.", icon: BarChart3, colorClass: "text-emerald-400 hover:border-emerald-500/20" },
                 { title: "Reliable Infrastructure", desc: "Built on modern cloud technology for speed and stability.", icon: Database, colorClass: "text-accent-hover hover:border-accent/20" } ].map((item, i) => {
                    const ItemIcon = item.icon;
                    return (
                      <div key={i} className={`flex flex-col gap-5 p-6 sm:p-7 rounded-2xl bg-neutral-900/10 border border-neutral-800/15 backdrop-blur-sm transition-all duration-300 ${item.colorClass}`}>
                          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-neutral-900/40 border border-neutral-800/80 flex items-center justify-center">
                              <ItemIcon className="w-5 h-5" />
                          </div>
                          <div>
                               <h4 className="font-bold text-white text-base mb-2 font-display">{item.title}</h4>
                               <p className="text-neutral-400 text-xs leading-relaxed">{item.desc}</p>
                          </div>
                      </div>
                    );
                 })}
            </div>
      </div>
    </section>
);

// Section 4: About Us