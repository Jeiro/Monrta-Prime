import React from 'react';
import { motion } from 'motion/react';
import { Zap, Shield, ShieldCheck, BarChart3, Lock, Globe, Layers, Target, Users, TrendingUp, ThumbsUp, Headset, Database, Puzzle, Fingerprint, Mail } from 'lucide-react';
import { useApp } from '../../context/AppContext';

// Section 5: Get Started
export const GetStarted = () => (
    <section className="py-16 px-4 max-w-6xl mx-auto" id="get-started">
        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-[40px] font-semibold text-ink tracking-tight leading-tight max-w-3xl mx-auto font-display text-center mb-16">
            Get Started In Minutes
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
            {[ 
                { step: "01", title: "Create Account", desc: "Register securely using email or Google." },
                { step: "02", title: "Fund Your Wallet", desc: "Deposit funds safely into your account." },
                { step: "03", title: "Start Trading", desc: "Access the market and monitor your portfolio in real time." } 
            ].map((step, i) => (
                <div 
                    key={i} 
                    className="flex flex-col items-center justify-center p-8 sm:p-10 rounded-2xl bg-[#0F1216]/60 border border-line/40 hover:border-accent/30 hover:bg-[#12161B]/80 transition-all duration-300 shadow-xl group text-center relative overflow-hidden"
                >
                    <div className="text-5xl sm:text-6xl font-extrabold text-ink/5 font-display tracking-tighter mb-4 group-hover:text-accent/15 transition-colors duration-300">
                        {step.step}
                    </div>
                    <h3 className="font-bold text-lg sm:text-xl text-ink mb-3 tracking-tight font-display">
                        {step.title}
                    </h3>
                    <p className="text-muted text-xs sm:text-sm leading-relaxed max-w-[240px] mx-auto font-sans">
                        {step.desc}
                    </p>
                </div>
            ))}
        </div>
    </section>
);

// Section 6: Contact Us