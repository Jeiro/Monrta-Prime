import React, { useState } from 'react';
import { motion } from 'motion/react';

export const ZeroPercentLoopCard = () => {
  const [videoError, setVideoError] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);

  return (
    <div className="relative flex flex-col items-center justify-center p-1 bg-transparent overflow-hidden h-[340px] sm:h-[380px] w-full group/card">
      {/* Loop video wrapper */}
      {!videoError && (
        <video
          autoPlay
          loop
          muted
          playsInline
          className={`absolute inset-0 w-full h-full object-cover select-none pointer-events-none z-10 transition-opacity duration-300 ${
            videoPlaying ? "opacity-100" : "opacity-0"
          }`}
          onPlaying={() => setVideoPlaying(true)}
          onCanPlayThrough={() => setVideoPlaying(true)}
          onError={() => setVideoError(true)}
        >
          <source src="/assets/input_file_0.mp4" type="video/mp4" />
          <source src="/input_file_0.mp4" type="video/mp4" />
          <source src="/assets/input_file_1.mp4" type="video/mp4" />
          <source src="/assets/.aistudio/input_file_0.mp4" type="video/mp4" />
        </video>
      )}

      {/* Exquisite pure React Fallback or overlay text */}
      <div className="relative z-20 flex flex-col items-center text-center w-full h-full justify-center">
        {(!videoPlaying || videoError) && (
          <div className="relative flex items-center justify-center mb-1">
            <motion.div
              animate={{
                y: [0, -6, 0],
                rotateY: [-5, 5, -5],
                rotateX: [3, -3, 3]
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="relative w-44 h-44 sm:w-48 sm:h-48 flex items-center justify-center select-none"
              style={{ transformStyle: "preserve-3d", perspective: "800px" }}
            >
              <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_15px_25px_rgba(255,255,255,0.12)]">
                <defs>
                  <linearGradient id="metalBevel" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFFFFF" />
                    <stop offset="30%" stopColor="#E2E8F0" />
                    <stop offset="70%" stopColor="#94A3B8" />
                    <stop offset="100%" stopColor="#475569" />
                  </linearGradient>
                  
                  <linearGradient id="metalFace" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFFFFF" />
                    <stop offset="50%" stopColor="#F1F5F9" />
                    <stop offset="100%" stopColor="#CBD5E1" />
                  </linearGradient>
                  
                  <linearGradient id="accentGlow" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#6AA5FF" />
                    <stop offset="100%" stopColor="#FF6600" />
                  </linearGradient>

                  <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                <ellipse cx="50" cy="85" rx="35" ry="6" fill="#000000" opacity="0.45" filter="url(#softGlow)" />

                <path d="M50,15 A25,30 0 1,0 50,75 A25,30 0 1,0 50,15 Z M50,28 A12,17 0 1,1 50,62 A12,17 0 1,1 50,28 Z" fill="url(#metalBevel)" transform="translate(0, 5)" />
                <path d="M50,15 A25,30 0 1,0 50,75 A25,30 0 1,0 50,15 Z M50,28 A12,17 0 1,1 50,62 A12,17 0 1,1 50,28 Z" fill="url(#metalBevel)" transform="translate(0, 3)" />
                <path d="M50,15 A25,30 0 1,0 50,75 A25,30 0 1,0 50,15 Z M50,28 A12,17 0 1,1 50,62 A12,17 0 1,1 50,28 Z" fill="url(#metalBevel)" transform="translate(0, 1)" />

                <path d="M50,15 A25,30 0 1,0 50,75 A25,30 0 1,0 50,15 Z M50,28 A12,17 0 1,1 50,62 A12,17 0 1,1 50,28 Z" fill="url(#metalFace)" stroke="#FFFFFF" strokeWidth="0.5" />
                
                <g transform="translate(48, 48) scale(0.38)" fill="none" stroke="url(#accentGlow)" strokeWidth="6">
                  <circle cx="20" cy="20" r="8" fill="#6AA5FF" fillOpacity="0.2" strokeWidth="4" />
                  <circle cx="50" cy="50" r="8" fill="#6AA5FF" fillOpacity="0.2" strokeWidth="4" />
                  <line x1="50" y1="20" x2="20" y2="50" strokeLinecap="round" strokeWidth="5" />
                </g>
              </svg>

              <div className="absolute inset-0 z-20 pointer-events-none">
                <motion.div
                  animate={{
                    x: [30, 20, -40, -50, -40, 20, 30],
                    y: [40, -55, -45, 10, 50, 65, 40],
                    scale: [0.9, 1.15, 0.75, 0.65, 0.8, 1.05, 0.9],
                    rotate: [0, 180, 360],
                    zIndex: [25, 25, 5, 5, 25, 25, 25]
                  }}
                  transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
                  className="absolute left-1/2 top-1/2 -ml-5 -mt-5 w-10 h-10 rounded-full bg-gradient-to-br from-[#26A17B] to-[#1a7d5f] border-2 border-[#FFFFFF]/80 flex items-center justify-center text-white text-xs font-black font-sans shadow-lg shadow-[#26A17B]/30 transform-gpu"
                >
                  USDT
                </motion.div>

                <motion.div
                  animate={{
                    x: [-45, -35, 30, 45, 30, -35, -45],
                    y: [-40, 15, 50, 30, -55, -50, -40],
                    scale: [0.75, 0.65, 0.9, 1.12, 0.95, 0.75, 0.75],
                    rotate: [360, 180, 0],
                    zIndex: [5, 5, 25, 25, 25, 5, 5]
                  }}
                  transition={{ duration: 8.5, repeat: Infinity, ease: "linear" }}
                  className="absolute left-1/2 top-1/2 -ml-5 -mt-5 w-10 h-10 rounded-full bg-gradient-to-br from-[#FF9900] to-[#FF5500] border-2 border-slate-200/90 flex items-center justify-center text-white text-lg font-black font-mono shadow-lg shadow-[#FF9900]/30 transform-gpu"
                >
                  ₿
                </motion.div>

                <motion.div
                  animate={{
                    x: [20, 50, 40, -20, -45, -20, 20],
                    y: [-45, 10, 45, 50, -10, -55, -45],
                    scale: [1.1, 0.9, 0.7, 0.8, 1.12, 1.15, 1.1],
                    rotate: [45, 225, 405],
                    zIndex: [25, 25, 5, 25, 25, 25, 25]
                  }}
                  transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                  className="absolute left-1/2 top-1/2 -ml-4.5 -mt-4.5 w-9 h-9 rounded-full bg-gradient-to-tr from-[#9945FF] via-[#14F195] to-[#9945FF] border border-white/50 flex items-center justify-center text-neutral-900 text-[9px] font-black shadow-lg transform-gpu"
                >
                  SOL
                </motion.div>

                <motion.div
                  animate={{
                    x: [-15, -50, -20, 40, 52, 15, -15],
                    y: [55, 15, -45, -52, 5, 45, 55],
                    scale: [0.85, 1.05, 1.1, 0.75, 0.65, 0.82, 0.85],
                    rotate: [-30, 150, 330],
                    zIndex: [25, 25, 25, 5, 5, 25, 25]
                  }}
                  transition={{ duration: 9.2, repeat: Infinity, ease: "linear" }}
                  className="absolute left-1/2 top-1/2 -ml-4 -mt-4 w-8 h-8 rounded-full bg-gradient-to-br from-[#FF0013] to-[#b3000e] border border-white/40 flex items-center justify-center text-white text-[10px] font-bold shadow-lg transform-gpu"
                >
                  TRX
                </motion.div>
              </div>
            </motion.div>
          </div>
        )}

        <div className={`transition-all duration-300 ${videoPlaying ? "absolute bottom-3 left-2 right-2 p-2 text-center" : "w-full mt-2"}`}>
          <span className="text-[10px] font-mono font-bold tracking-[0.3em] text-accent uppercase block drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
            Derivative Fee Rate
          </span>
          <span className="text-[9px] text-neutral-300 font-sans mt-1 max-w-[210px] mx-auto block leading-relaxed drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
            Institutional liquidity with zero standard maker commission charges.
          </span>
        </div>
      </div>
    </div>
  );
};
