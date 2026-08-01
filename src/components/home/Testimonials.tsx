import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { Star, ArrowRight } from 'lucide-react';

export interface Testimonial {
  title: string;
  text: string;
  name: string;
  initials: string;
  /** Human-readable age of the review, e.g. "2 days ago". */
  time: string;
  rating: number;
}

export interface TestimonialsProps {
  /** Real, attributable customer reviews. Never sample or illustrative data. */
  items: Testimonial[];
  /**
   * Aggregate rating, shown only when supplied. It must come from a real
   * count of real reviews — the previous hardcoded "4.8 / 5 from 2,782
   * reviews" was invented, which is why this is now a required input rather
   * than a default baked into the component.
   */
  aggregate?: { score: number; count: number };
}

/**
 * Display component for customer testimonials.
 *
 * It deliberately holds NO content of its own. It previously shipped five
 * invented reviews and an invented aggregate rating, which rendered on the
 * public homepage as though they were real customers. The markup was never
 * the problem; the fabricated data was. Callers now have to supply reviews
 * they can actually attribute, and if there are none the component renders
 * nothing rather than falling back to samples.
 */
export const Testimonials: React.FC<TestimonialsProps> = ({ items, aggregate }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!items.length) return null;

  return (
    <section className="py-16 bg-ground border-t border-line/50 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-accent-soft border border-accent-line text-accent text-xs font-bold uppercase tracking-widest mb-5">
            <Star size={12} fill="currentColor" /> Trusted Reviews
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold text-ink tracking-tight">
            What Our Clients Say
          </h2>
          {/* No "join thousands of investors" line here. That was the same
              fabricated-claim problem as the reviews themselves — an
              unverifiable count asserted in the markup. If there is a real
              figure to cite, pass `aggregate` and it renders below. */}
          <p className="mt-4 text-muted max-w-lg mx-auto text-sm md:text-base">
            What our customers say about trading on Moneta Prime
          </p>
        </div>

        {/* Overall rating — only when a real aggregate is supplied. */}
        {aggregate ? (
          <div className="flex flex-col items-center gap-2 mb-12">
            <div className="flex items-center gap-1 text-accent">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={26} fill={i < Math.round(aggregate.score) ? "currentColor" : "none"} />
              ))}
            </div>
            <p className="text-muted text-sm">
              Rated <span className="text-ink font-bold">{aggregate.score}</span> / 5 based on{" "}
              <span className="text-ink font-bold">{aggregate.count.toLocaleString()}</span> reviews
            </p>
          </div>
        ) : null}

        {/* Scrollable Cards */}
        <div
          ref={scrollRef}
          className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {items.map((t, idx) => (
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
                <span className="text-2xs font-bold px-2.5 py-0.5 rounded-full bg-raised text-muted border border-line">
                  {t.rating} Stars
                </span>
              </div>

              {/* Title */}
              <h3 className="text-ink font-extrabold text-lg mb-3">{t.title}</h3>

              {/* Body */}
              <p className="text-muted text-sm leading-relaxed flex-1 mb-6">
                {t.text}
              </p>

              {/* Divider */}
              <div className="border-t border-line mb-5" />

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-raised border border-line flex items-center justify-center text-ink font-bold text-sm shrink-0">
                  {t.initials}
                </div>
                <div>
                  <h4 className="text-ink font-bold text-sm">{t.name}</h4>
                  <p className="text-faint text-xs">{t.time}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Swipe hint */}
        <div className="flex items-center justify-center gap-2 mt-8 text-faint text-sm">
          Swipe to see more <ArrowRight size={16} />
        </div>

      </div>
    </section>
  );
};
