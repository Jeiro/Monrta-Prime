import React from 'react';
import { motion } from 'motion/react';
import { Zap, Shield, ShieldCheck, BarChart3, Lock, Globe, Layers, Target, Users, TrendingUp, ThumbsUp, Headset, Database, Puzzle, Fingerprint, Mail } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Brandmark } from "../ui/Brandmark";

// Section 4: About Us
export const AboutUs = () => (
    <section className="pt-12 pb-16 px-4 bg-[#0B0E11]/30 text-center flex flex-col items-center justify-center" id="about-us">
        {/* Brand Logo Icon on Top */}
        <div className="mb-6 relative group inline-block">
            <Brandmark className="w-16 h-16 transform group-hover:rotate-12 transition-transform duration-500 filter drop-shadow-[0_4px_12px_rgba(106,165,255,0.3)]" />
        </div>

        {/* Brand styled heading: lowercase 'moneta prime' with white/accent split, using the Bybit font layout */}
        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-[40px] font-semibold text-white tracking-tight leading-tight font-display mb-4">
            About <span className="lowercase text-white">moneta <span className="text-accent">prime</span></span>
        </h2>
        <p className="text-neutral-400 text-base md:text-lg max-w-2xl mx-auto mb-6 leading-relaxed font-sans">
            <span className="lowercase text-white font-medium">moneta <span className="text-accent">prime</span></span> is a modern digital trading platform built to provide users with a secure, transparent, and efficient trading experience.
        </p>
        <p className="text-neutral-400 text-sm sm:text-base max-w-3xl mx-auto mb-2 leading-relaxed font-sans">
            Our mission is to make trading accessible and straightforward for everyone. By combining innovative technology with an intuitive interface, <span className="lowercase text-white font-medium">moneta <span className="text-accent">prime</span></span> empowers users to manage their investments confidently and stay connected to global financial markets. We focus on security, simplicity, and continuous innovation to create a platform that traders can rely on every day.
        </p>
    </section>
);

// Section 5: Get Started