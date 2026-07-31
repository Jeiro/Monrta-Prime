import React, { useId } from "react";

/**
 * The Moneta Prime mark.
 *
 * A cut hexagonal prism — "prime" as in first-quality, precise, mineral —
 * with an ascending position line knocked out of it. It replaces the old
 * Orbitrio orbit-crescent motif, which encoded a name we no longer use.
 *
 * Filled rather than outlined on purpose: this renders at 28-38px in the
 * nav and footer, where a hairline outline would disappear.
 *
 * Gradient ids are derived from useId() because the mark appears several
 * times per document — hardcoded ids collide and every instance after the
 * first silently inherits the first one's gradient.
 */
export function Brandmark({ className = "" }: { className?: string }) {
  const uid = useId();
  const grad = `mp-mark-${uid}`;

  return (
    <svg viewBox="0 0 100 100" className={className} role="presentation" aria-hidden="true">
      <defs>
        <linearGradient id={grad} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#2E6BE0" />
          <stop offset="55%" stopColor="#6AA5FF" />
          <stop offset="100%" stopColor="#8ABAFF" />
        </linearGradient>
      </defs>

      <path d="M50 4 L91 27 L91 73 L50 96 L9 73 L9 27 Z" fill={`url(#${grad})`} />

      {/* Ascending position line, knocked out of the prism */}
      <polyline
        points="26,64 42,52 56,60 74,34"
        fill="none"
        stroke="#0B0C0F"
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Emphasised endpoint — the one place the mark draws the eye */}
      <circle cx="74" cy="34" r="8" fill="#0B0C0F" />
      <circle cx="74" cy="34" r="3.6" fill="#E9EBEF" />
    </svg>
  );
}

/**
 * The text lockup. Lowercase, with the accent carried by "prime" only —
 * the same white/accent split the About section uses, so the two read as
 * one identity.
 */
export function Wordmark({
  className = "",
  tagline,
  taglineClassName = "",
}: {
  className?: string;
  tagline?: string;
  taglineClassName?: string;
}) {
  return (
    <div>
      <span className={`font-display block leading-none lowercase tracking-[0.01em] text-ink ${className}`}>
        moneta <span className="text-accent">prime</span>
      </span>
      {tagline && (
        <span className={`font-mono tracking-[0.25em] text-muted block mt-1 ${taglineClassName}`}>
          {tagline}
        </span>
      )}
    </div>
  );
}

/** Used under the wordmark in the nav and mobile menu. */
export const BRAND_TAGLINE = "TRADE. COMPOUND. PRESERVE.";
