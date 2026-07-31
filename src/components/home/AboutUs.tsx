import React from 'react';
import { motion } from 'motion/react';
import { Zap, Shield, ShieldCheck, BarChart3, Lock, Globe, Layers, Target, Users, TrendingUp, ThumbsUp, Headset, Database, Puzzle, Fingerprint, Mail } from 'lucide-react';
import { useApp } from '../../context/AppContext';

// Section 4: About Us
export const AboutUs = () => (
    <section className="pt-12 pb-16 px-4 bg-[#0B0E11]/30 text-center flex flex-col items-center justify-center" id="about-us">
        {/* Brand Logo Icon on Top */}
        <div className="mb-6 relative group inline-block">
            <svg className="w-16 h-16 transform group-hover:rotate-12 transition-transform duration-500 filter drop-shadow-[0_4px_12px_rgba(106,165,255,0.3)]" viewBox="0 0 100 100">
              <defs>
                <linearGradient id="aboutGoldGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#2E6BE0" />
                  <stop offset="45%" stopColor="#6AA5FF" />
                  <stop offset="100%" stopColor="#8ABAFF" />
                </linearGradient>
                <linearGradient id="aboutSilverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="50%" stopColor="#E6E8EF" />
                  <stop offset="100%" stopColor="#A3AABF" />
                </linearGradient>
              </defs>
              
              {/* Top-left Orange Crescent loop */}
              <path 
                d="M 18,50 A 30,30 0 0,1 78,28 L 71,35 A 20,20 0 0,0 26,50 Z" 
                fill="url(#aboutGoldGrad)" 
              />
              
              {/* Diagonal premium sweeping logo slash */}
              <path 
                d="M 18,50 C 23,48 45,38 78,28 C 65,37 40,45 18,50" 
                fill="url(#aboutGoldGrad)" 
              />

              {/* Bottom-right Silver/White Crescent loop */}
              <path 
                d="M 23,55 A 30,30 0 0,0 82,50 A 30,30 0 0,0 78,28 L 71,35 A 20,20 0 0,1 74,50 A 20,20 0 0,1 28,54 Z" 
                fill="url(#aboutSilverGrad)" 
              />

              {/* Top right orange brand accent satellite dot */}
              <circle cx="85" cy="22" r="5.5" fill="#6AA5FF" />
            </svg>
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