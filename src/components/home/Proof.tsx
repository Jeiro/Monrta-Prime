import React from 'react';
import { motion } from 'motion/react';
import { Layers, Gauge, LineChart, Headset, Lock, Shield, Zap, Globe, Fingerprint, BarChart3, Database } from 'lucide-react';
import { Section, Container, SectionHeading } from '../ui/Layout';
import proofTeam1200 from '../../assets/proof-team-1200.jpg';
import proofTeam600 from '../../assets/proof-team-600.jpg';

/**
 * Consolidated trust band.
 *
 * Replaces two separate full-height sections (WhyMonetaPrime + Confidence)
 * that made overlapping claims across ~1,250px.
 *
 * The originals coloured every icon differently (indigo, emerald, pink,
 * sky, blue), which is six accents fighting the one accent the system
 * allows. Icons are neutral here.
 *
 * This band deliberately contains NO usage figures and NO press mentions.
 * It previously opened with "6,000+ active investors", "$600M+ profits
 * generated" and "99% client satisfaction", and closed with an "As featured
 * in" strip naming Bloomberg, Forbes, Reuters, CoinDesk and TechCrunch.
 * None of it had anything behind it. A checkable claim that turns out false
 * costs more trust than making no claim, and naming real publications that
 * never covered the platform carries more than a trust cost. The four tiles
 * now describe what the product does — claims that are true by construction
 * and that nobody has to take on faith. Do not reintroduce a metric here
 * unless it is derived from real data.
 */

const CAPABILITIES = [
  { icon: Layers, title: 'Multi-asset access', desc: 'Equities, crypto and FX in one workspace' },
  { icon: Gauge, title: 'Institutional-grade execution', desc: 'Orders routed and filled in real time' },
  { icon: LineChart, title: 'Live market data', desc: 'Streaming prices across every market' },
  { icon: Headset, title: '24/7 expert support', desc: 'Real humans, always on' },
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

export const Proof = () => (
  <Section divided className="bg-ground" id="why-moneta-prime">
    <Container>
      <SectionHeading
        eyebrow="Trusted worldwide"
        title="Built for people who move real money"
        description="Security and transparency sit at the centre of everything on the platform."
      />

      {/* Capabilities. Same four-tile shape the figures used, but a <ul>
          rather than a <dl>: these are statements, not term/value pairs.
          Nothing here takes the accent — the accent marks the single most
          important figure on a screen, and this row no longer has one. */}
      <motion.ul
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="mt-10 grid grid-cols-2 gap-3 lg:grid-cols-4"
      >
        {CAPABILITIES.map(({ icon: Icon, title, desc }) => (
          <li key={title} className="rounded-xl border border-line bg-surface p-5">
            <Icon size={16} className="text-faint" />
            <p className="mt-3 text-sm font-semibold tracking-tight text-ink">{title}</p>
            <p className="mt-1.5 text-2xs leading-relaxed text-faint">{desc}</p>
          </li>
        ))}
      </motion.ul>

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

      {/* Photograph.
          This band makes a claim about people ("built for people who move real
          money") and was carried entirely by icons. The photo grounds it.

          Treatment matches the hero: desaturated, dimmed, and covered by a
          --mp-ground gradient running from opaque at the left/bottom to clear,
          so the image sits inside the palette rather than on top of it, in
          both themes. aria-hidden — it is atmosphere, not information. */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative mt-8 overflow-hidden rounded-2xl border border-line"
        aria-hidden="true"
      >
        <img
          src={proofTeam1200}
          srcSet={`${proofTeam600} 600w, ${proofTeam1200} 1200w`}
          sizes="(min-width: 1024px) 1024px, 100vw"
          alt=""
          loading="lazy"
          decoding="async"
          className="h-48 w-full object-cover opacity-[0.62] saturate-[0.55] sm:h-64"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-ground via-ground/60 to-ground/15" />
        <div className="absolute inset-0 bg-gradient-to-t from-ground via-ground/40 to-transparent" />
        <p className="absolute bottom-5 left-5 right-5 max-w-md text-sm leading-relaxed text-muted sm:bottom-6 sm:left-6">
          <span className="block text-sm font-semibold text-ink">A platform people work in every day</span>
          Markets, balances and transaction history in one place, with the same
          data behind every view.
        </p>
      </motion.div>
    </Container>
  </Section>
);
