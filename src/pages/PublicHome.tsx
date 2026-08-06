import React from "react";
import { useSeo } from "../lib/useSeo";
import { useSession } from "../context/domains/SessionContext";
// No <Footer> here: App.tsx renders one globally for every non-admin,
// non-auth route, so rendering it again stacked two footers on the homepage.
import { InvestmentPlansSection } from "../components/HomeSections";
import { Hero, StatsBar, BentoGrid, YieldCalculator, SecurityTrust, FinalCta } from "../components/landing";

export const PublicHome: React.FC<{ onNavigate: (view: string) => void }> = ({ onNavigate }) => {
  useSeo({
    title: "Moneta Prime — Crypto Trading, Copy Trading & Investment Plans",
    description: "Trade crypto with precision on Moneta Prime. Real-time markets, tiered investment plans, and copy trading in one workspace built for serious traders.",
    path: "/",
  });
  const { user } = useSession();

  return (
    <div className="min-h-screen bg-transparent text-ink font-sans selection:bg-accent/20 overflow-x-hidden pt-0">
      
      <Hero onNavigate={onNavigate} isLoggedIn={user.isLoggedIn} />
      <StatsBar />
      <BentoGrid />
      <YieldCalculator />

      {/* Kept from the previous homepage: this one renders real plans out of
          Supabase rather than static marketing copy, so it stays. */}
      <InvestmentPlansSection onNavigate={onNavigate} />

      <SecurityTrust />
      <FinalCta onNavigate={onNavigate} isLoggedIn={user.isLoggedIn} />
    </div>
  );
};
