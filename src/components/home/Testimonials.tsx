import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { Star, ArrowRight } from 'lucide-react';

const TESTIMONIALS = [
  {
    title: "Outstanding Platform",
    text: "This broker is incredibly reliable with excellent customer support. My investments have been performing consistently well. Highly recommended!",
    name: "James Miller",
    initials: "JM",
    time: "2 days ago",
    rating: 5,
  },
  {
    title: "Trading Made Easy",
    text: "The copy trading feature is a game changer. I've been able to mirror top-performing traders and my portfolio has grown significantly since joining.",
    name: "Sarah Clarke",
    initials: "SC",
    time: "5 days ago",
    rating: 5,
  },
  {
    title: "Top-Tier Security",
    text: "I feel completely safe with my assets on Moneta Prime. The institutional-grade security combined with real-time execution makes it the best platform I've ever used.",
    name: "Daniel Okoye",
    initials: "DO",
    time: "1 week ago",
    rating: 5,
  },
  {
    title: "Incredible Returns",
    text: "The investment plans are transparent and the returns have been consistent. Moneta Prime has exceeded my expectations as a professional trading platform.",
    name: "Amara Obi",
    initials: "AO",
    time: "3 days ago",
    rating: 5,
  },
  {
    title: "Fast & Professional",
    text: "Withdrawals are processed quickly, the dashboard is intuitive, and the market data is always up to date. Moneta Prime is the real deal for serious investors.",
    name: "Kevin Brooks",
    initials: "KB",
    time: "1 week ago",
    rating: 4,
  },
];

export const Testimonials = () => {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <section className="py-16 bg-ground border-t border-line/50 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-5">
            <Star size={12} fill="currentColor" /> Trusted Reviews
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
            What Our Clients Say
          </h2>
          <p className="mt-4 text-slate-400 max-w-lg mx-auto text-sm md:text-base">
            Join thousands of satisfied investors who trust us with their financial goals
          </p>
        </div>

        {/* Overall rating */}
        <div className="flex flex-col items-center gap-2 mb-12">
          <div className="flex items-center gap-1 text-accent">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={26} fill="currentColor" />
            ))}
          </div>
          <p className="text-slate-400 text-sm">
            Rated <span className="text-emerald-400 font-bold">4.8</span> / 5 based on <span className="text-emerald-400 font-bold">2,782</span> reviews
          </p>
        </div>

        {/* Scrollable Cards */}
        <div
          ref={scrollRef}
          className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {TESTIMONIALS.map((t, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.5, ease: "easeOut" }}
              className="min-w-[300px] sm:min-w-[340px] bg-panel border border-line rounded-2xl p-6 snap-start flex flex-col"
            >
              {/* Stars + Badge */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-0.5 text-accent">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} size={14} fill="currentColor" />
                  ))}
                  {[...Array(5 - t.rating)].map((_, i) => (
                    <Star key={i} size={14} className="text-line" />
                  ))}
                </div>
                <span className="text-2xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  {t.rating} Stars
                </span>
              </div>

              {/* Title */}
              <h3 className="text-white font-extrabold text-lg mb-3">{t.title}</h3>

              {/* Body */}
              <p className="text-slate-400 text-sm leading-relaxed flex-1 mb-6">
                {t.text}
              </p>

              {/* Divider */}
              <div className="border-t border-line mb-5" />

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {t.initials}
                </div>
                <div>
                  <h4 className="text-white font-bold text-sm">{t.name}</h4>
                  <p className="text-slate-500 text-xs">{t.time}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Swipe hint */}
        <div className="flex items-center justify-center gap-2 mt-8 text-slate-500 text-sm">
          Swipe to see more <ArrowRight size={16} />
        </div>

      </div>
    </section>
  );
};
