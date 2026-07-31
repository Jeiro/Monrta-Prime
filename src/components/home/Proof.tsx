import React from 'react';
import { motion } from 'motion/react';
import { Users, TrendingUp, ThumbsUp, Headset, Lock, Shield, Zap, Globe, Fingerprint, BarChart3, Database } from 'lucide-react';
import { Section, Container, SectionHeading } from '../ui/Layout';

/**
 * Consolidated trust band.
 *
 * Replaces two separate full-height sections (WhyMonetaPrime + Confidence)
 * that made overlapping claims across ~1,250px. Same content — the four
 * headline figures, the four assurances, the three security pillars, the
 * press strip — in one band.
 *
 * The originals coloured every icon differently (indigo, emerald, pink,
 * sky, blue), which is six accents fighting the one accent the system
 * allows. Icons are now neutral; the accent marks the figures only.
 */

const STATS = [
  { value: '6,000+', label: 'Active investors', icon: Users },
  { value: '$600M+', label: 'Profits generated', icon: TrendingUp },
  { value: '99%', label: 'Client satisfaction', icon: ThumbsUp },
  { value: '24/7', label: 'Expert support', icon: Headset },
];

const ASSURANCES = [
  { icon: Lock, title: 'SSL secured', desc: '256-bit encryption' },
  { icon: Shield, title: 'Regulated', desc: 'Licensed platform' },
  { icon: Zap, title: 'Fast withdrawals', desc: 'Within 24 hours' },
  { icon: Globe, title: 'Data privacy', desc: 'GDPR compliant' },
];

const PILLARS = [
  {
    icon: Fingerprint,
    title: 'Account security',
    desc: 'Advanced authentication and encryption technologies keep your account protected.',
  },
  {
    icon: BarChart3,
    title: 'Transparent transactions',
    desc: 'Monitor your balances and full transaction history at any time.',
  },
  {
    icon: Database,
    title: 'Reliable infrastructure',
    desc: 'Built on modern cloud technology for speed and stability under load.',
  },
];

const PRESS = ['Bloomberg', 'Forbes', 'Reuters', 'CoinDesk', 'TechCrunch'];

export const Proof = () => (
  <Section divided className="bg-ground" id="why-moneta-prime">
    <Container>
      <SectionHeading
        eyebrow="Trusted worldwide"
        title="Built for people who move real money"
        description="Security and transparency sit at the centre of everything on the platform."
      />

      {/* Headline figures — the only accented numbers on the page. */}
      <motion.dl
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="mt-10 grid grid-cols-2 gap-3 lg:grid-cols-4"
      >
        {STATS.map(({ value, label, icon: Icon }) => (
          <div key={label} className="rounded-xl border border-line bg-surface p-5">
            <Icon size={16} className="text-faint" />
            <dd className="mt-3 font-data tabular-nums text-2xl font-semibold tracking-tight text-accent">
              {value}
            </dd>
            <dt className="mt-1 text-2xs font-semibold uppercase tracking-[0.09em] text-faint">
              {label}
            </dt>
          </div>
        ))}
      </motion.dl>

      {/* Assurances — compact row, no card chrome competing with the figures. */}
      <ul className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {ASSURANCES.map(({ icon: Icon, title, desc }) => (
          <li
            key={title}
            className="flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3.5"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line bg-panel text-muted">
              <Icon size={16} />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-ink">{title}</span>
              <span className="block truncate text-2xs text-faint">{desc}</span>
            </span>
          </li>
        ))}
      </ul>

      {/* Security pillars */}
      <div className="mt-3 grid gap-3 md:grid-cols-3">
        {PILLARS.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="rounded-xl border border-line bg-surface p-5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-panel text-muted">
              <Icon size={16} />
            </span>
            <h3 className="mt-4 text-sm font-semibold text-ink">{title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">{desc}</p>
          </div>
        ))}
      </div>

      {/* Press strip */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 border-t border-line/60 pt-6">
        <span className="text-2xs font-semibold uppercase tracking-[0.14em] text-faint">
          As featured in
        </span>
        {PRESS.map(name => (
          <span key={name} className="text-sm font-medium text-muted/70">
            {name}
          </span>
        ))}
      </div>
    </Container>
  </Section>
);
