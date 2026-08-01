import React from "react";
import { motion } from "motion/react";
import { FileText, Database, Settings, Cookie, ShieldCheck, Share2, User, RefreshCw, Mail } from "lucide-react";
import { useSiteSettings } from "../context/domains/SiteSettingsContext";

interface PrivacyPageProps {
  onNavigate: (view: string) => void;
}

export const PrivacyPage: React.FC<PrivacyPageProps> = ({ onNavigate }) => {
  const { appSettings } = useSiteSettings();

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto px-4 py-16 text-muted"
    >
      <h1 className="text-4xl font-extrabold text-ink mb-6 font-heading flex items-center gap-3">
        <FileText className="w-8 h-8 text-accent" />
        Privacy Policy
      </h1>
      <p className="mb-10 text-lg">Your privacy is important to us.</p>
      
      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-bold text-ink mb-3 flex items-center gap-3">
            <Database className="w-6 h-6 text-accent" />
            1. Information We Collect
          </h2>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Name</li>
            <li>Email address</li>
            <li>Phone number</li>
            <li>Country</li>
            <li>Login history</li>
            <li>Device information</li>
            <li>Transaction history</li>
            <li>Account activity</li>
          </ul>
        </section>
        
        <section>
          <h2 className="text-2xl font-bold text-ink mb-3 flex items-center gap-3">
            <Settings className="w-6 h-6 text-accent" />
            2. How We Use Information
          </h2>
          <p>We use information to:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Create accounts.</li>
            <li>Authenticate users.</li>
            <li>Improve services.</li>
            <li>Detect fraud.</li>
            <li>Send account notifications.</li>
            <li>Provide customer support.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-ink mb-3 flex items-center gap-3">
            <Cookie className="w-6 h-6 text-accent" />
            3. Cookies
          </h2>
          <p><span className="lowercase text-ink font-semibold">moneta <span className="text-accent">prime</span></span> may use cookies and analytics technologies to improve user experience.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-ink mb-3 flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-accent" />
            4. Data Security
          </h2>
          <p>We use industry-standard security measures to protect user information.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-ink mb-3 flex items-center gap-3">
            <Share2 className="w-6 h-6 text-accent" />
            5. Sharing Information
          </h2>
          <p><span className="lowercase text-ink font-semibold">moneta <span className="text-accent">prime</span></span> does not sell personal information.</p>
          <p>Information may only be shared:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>When required by law.</li>
            <li>For security reasons.</li>
            <li>With trusted service providers.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-ink mb-3 flex items-center gap-3">
            <User className="w-6 h-6 text-accent" />
            6. User Rights
          </h2>
          <p>Users may:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Access their information.</li>
            <li>Update personal details.</li>
            <li>Request account deletion.</li>
            <li>Contact support.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-ink mb-3 flex items-center gap-3">
            <RefreshCw className="w-6 h-6 text-accent" />
            7. Policy Updates
          </h2>
          <p>This Privacy Policy may be updated periodically.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-ink mb-3 flex items-center gap-3">
            <Mail className="w-6 h-6 text-accent" />
            8. Contact
          </h2>
          <p>{appSettings.supportEmail}</p>
        </section>
      </div>
    </motion.div>
  );
};




