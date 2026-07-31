import React from "react";
import { motion } from "motion/react";
import { useApp } from "../context/AppContext";
import { Brandmark } from "./ui/Brandmark";

interface FooterProps {
  onNavigate: (view: string) => void;
}

const FOOTER_LINKS: { label: string; view: string }[] = [
  { label: "About Us", view: "home#about-us" },
  { label: "Markets", view: "markets" },
  // Guests get bounced to /auth by the route guard; signed-in users land on KYC.
  { label: "Security", view: "dashboard-kyc" },
  { label: "Contact", view: "home#contact" },
  { label: "Terms of Service", view: "terms" },
  { label: "Privacy Policy", view: "privacy" },
  { label: "Risk Disclosure", view: "risk" }
];

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const { appSettings } = useApp();

  return (
    <footer className="py-16 px-4 bg-ground border-t border-line/30">
      <motion.div
        initial={{ opacity: 0, scaleX: 0 }}
        whileInView={{ opacity: 1, scaleX: 1 }}
        transition={{ duration: 1 }}
        className="h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent mb-16"
      />
      <div className="orb-panel max-w-7xl mx-auto grid gap-10 p-6 sm:p-8 md:grid-cols-[1.2fr_0.8fr_0.8fr] font-mono text-sm">
        <div className="mb-4">
          <div className="flex items-center gap-2.5 mb-2">
            <Brandmark className="w-[28px] h-[28px] transition-transform duration-500 hover:rotate-6" />
            <h4 className="font-bold text-ink text-brand font-sans text-lg tracking-tight">
              <span className="lowercase">moneta <span className="text-accent">prime</span></span>
            </h4>
          </div>
          <p className="text-muted mb-4">Trade smarter with confidence.</p>
          <p className="text-faint">
            <span className="lowercase text-ink font-medium">moneta <span className="text-accent">prime</span></span> is committed to delivering a secure and seamless trading experience through innovation, transparency, and reliability.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {FOOTER_LINKS.map(link => (
            <button
              key={link.label}
              type="button"
              onClick={() => onNavigate(link.view)}
              className="text-muted hover:text-accent transition-colors text-left cursor-pointer"
            >
              {link.label}
            </button>
          ))}
        </div>
        <div>
          <h4 className="font-bold text-ink mb-4">Contact Us</h4>
          <p className="text-muted mb-2">Need help? Our support team is here for you.</p>
          <a href={`mailto:${appSettings.supportEmail}`} className="text-accent hover:text-accent-hover hover:underline transition-colors flex items-center gap-2">
            {appSettings.supportEmail}
          </a>
          <p className="text-faint mt-2">{appSettings.supportPhone}</p>
          <p className="text-faint mt-3 not-italic leading-relaxed">{appSettings.companyAddress}</p>
        </div>
      </div>
    </footer>
  );
};
