import React from "react";
import { motion } from "motion/react";
import { ShieldCheck, UserCheck, UserPlus, LayoutGrid, AlertTriangle, Ban, Lock, Scale, RefreshCw, Mail } from "lucide-react";
import { useApp } from "../context/AppContext";

interface TermsPageProps {
  onNavigate: (view: string) => void;
}

export const TermsPage: React.FC<TermsPageProps> = ({ onNavigate }) => {
  const { appSettings } = useApp();

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto px-4 py-16 text-muted"
    >
      <h1 className="text-4xl font-extrabold text-ink mb-6 font-heading flex items-center gap-3">
        <ShieldCheck className="w-8 h-8 text-accent" />
        Terms of Service
      </h1>
      <p className="mb-10 text-lg">Please read these terms carefully before using <span className="lowercase text-ink font-semibold">moneta <span className="text-accent">prime</span></span>.</p>
      
      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-bold text-ink mb-3 flex items-center gap-3">
            <UserCheck className="w-6 h-6 text-accent" />
            1. Eligibility
          </h2>
          <p>Users must be at least 18 years old and legally permitted to use financial services in their country.</p>
        </section>
        
        <section>
          <h2 className="text-2xl font-bold text-ink mb-3 flex items-center gap-3">
            <UserPlus className="w-6 h-6 text-accent" />
            2. Account Registration
          </h2>
          <p>Users are responsible for:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Providing accurate information.</li>
            <li>Protecting login credentials.</li>
            <li>Maintaining account security.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-ink mb-3 flex items-center gap-3">
            <LayoutGrid className="w-6 h-6 text-accent" />
            3. Platform Services
          </h2>
          <p><span className="lowercase text-ink font-semibold">moneta <span className="text-accent">prime</span></span> provides digital trading tools, market information, account management, and related services.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-ink mb-3 flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-accent" />
            4. Risk Disclosure
          </h2>
          <p>Trading digital assets involves risk.</p>
          <p>Users acknowledge that market prices can fluctuate and losses may occur.</p>
          <p><span className="lowercase text-ink font-semibold">moneta <span className="text-accent">prime</span></span> does not guarantee profits or investment returns.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-ink mb-3 flex items-center gap-3">
            <Ban className="w-6 h-6 text-accent" />
            5. Prohibited Activities
          </h2>
          <p>Users must not:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Commit fraud.</li>
            <li>Use bots or malicious software.</li>
            <li>Attempt unauthorized access.</li>
            <li>Impersonate others.</li>
            <li>Engage in illegal activities.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-ink mb-3 flex items-center gap-3">
            <Lock className="w-6 h-6 text-accent" />
            6. Security
          </h2>
          <p><span className="lowercase text-ink font-semibold">moneta <span className="text-accent">prime</span></span> uses reasonable security measures, but users are responsible for protecting their own accounts and devices.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-ink mb-3 flex items-center gap-3">
            <Scale className="w-6 h-6 text-accent" />
            7. Limitation of Liability
          </h2>
          <p><span className="lowercase text-ink font-semibold">moneta <span className="text-accent">prime</span></span> is not liable for:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Market losses.</li>
            <li>Internet failures.</li>
            <li>User mistakes.</li>
            <li>Third-party services.</li>
            <li>Unauthorized access caused by compromised credentials.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-ink mb-3 flex items-center gap-3">
            <RefreshCw className="w-6 h-6 text-accent" />
            8. Updates
          </h2>
          <p>These terms may change at any time.</p>
          <p>Continued use of the platform means acceptance of updated terms.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-ink mb-3 flex items-center gap-3">
            <Mail className="w-6 h-6 text-accent" />
            9. Contact
          </h2>
          <p>{appSettings.supportEmail}</p>
        </section>
      </div>
    </motion.div>
  );
};




