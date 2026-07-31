import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { Brandmark } from '../ui/Brandmark';
import { Section, Container } from '../ui/Layout';

/**
 * Closing band: who we are, then how to start.
 *
 * Replaces two separate sections (AboutUs + GetStarted, ~1,010px combined)
 * that both sat below the fold making the same "now sign up" argument.
 * Same copy, same three onboarding steps — one band, one CTA.
 */

const STEPS = [
  { step: '01', title: 'Create account', desc: 'Register securely using email or Google.' },
  { step: '02', title: 'Fund your wallet', desc: 'Deposit funds safely into your account.' },
  { step: '03', title: 'Start trading', desc: 'Access the market and monitor your portfolio in real time.' },
];

export const Closing = ({ onNavigate }: { onNavigate?: (view: string) => void }) => (
  <Section divided className="bg-ground" id="about-us">
    <Container width="wide">
      <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        {/* About */}
        <div className="flex flex-col items-start gap-4">
          <Brandmark className="w-12 h-12" />
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-ink text-balance">
            About <span className="lowercase">moneta <span className="text-accent">prime</span></span>
          </h2>
          <p className="text-base leading-relaxed text-muted">
            <span className="lowercase font-medium text-ink">
              moneta <span className="text-accent">prime</span>
            </span>{' '}
            is a modern digital trading platform built to give traders a secure, transparent, and
            efficient experience.
          </p>
          <p className="text-sm leading-relaxed text-muted">
            Our mission is to make trading accessible and straightforward. By combining innovative
            technology with an intuitive interface, we help you manage investments confidently and
            stay connected to global financial markets — with security, simplicity, and continuous
            improvement at the core.
          </p>
        </div>

        {/* Get started */}
        <div id="get-started">
          <h3 className="text-2xl font-semibold tracking-tight text-ink">Get started in minutes</h3>
          <ol className="mt-6 flex flex-col gap-3">
            {STEPS.map(({ step, title, desc }, i) => (
              <motion.li
                key={step}
                initial={{ opacity: 0, x: 12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.4, delay: i * 0.07, ease: 'easeOut' }}
                className="flex items-start gap-4 rounded-xl border border-line bg-surface p-4"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-accent-line bg-accent-soft font-data text-sm font-semibold text-accent">
                  {step}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-ink">{title}</span>
                  <span className="mt-0.5 block text-sm leading-relaxed text-muted">{desc}</span>
                </span>
              </motion.li>
            ))}
          </ol>

          <button
            type="button"
            onClick={() => onNavigate?.('register')}
            className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-md bg-accent px-6 text-base font-semibold text-ground transition-colors hover:bg-accent-hover cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Create your account
            <ArrowRight size={17} />
          </button>
        </div>
      </div>
    </Container>
  </Section>
);
