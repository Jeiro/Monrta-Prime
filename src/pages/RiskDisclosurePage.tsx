import React from "react";
import { motion } from "motion/react";
import { AlertTriangle, TrendingDown, History, Wallet, Info, Globe2, BookOpen, Mail } from "lucide-react";
import { useApp } from "../context/AppContext";
import { useSeo } from "../lib/useSeo";

interface RiskDisclosurePageProps {
  onNavigate: (view: string) => void;
}

const Brand = () => (
  <span className="lowercase text-ink font-semibold">moneta <span className="text-accent">prime</span></span>
);

export const RiskDisclosurePage: React.FC<RiskDisclosurePageProps> = ({ onNavigate }) => {
  const { appSettings } = useApp();

  useSeo({
    title: "Risk Disclosure — Moneta Prime",
    description: "Important risk information for users of Moneta Prime. Trading and investing carry risk of loss; past performance does not guarantee future results.",
    path: "/risk",
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto px-4 py-16 text-muted"
    >
      <h1 className="text-4xl font-extrabold text-ink mb-6 font-heading flex items-center gap-3">
        <AlertTriangle className="w-8 h-8 text-accent" />
        Risk Disclosure
      </h1>
      <p className="mb-10 text-lg">
        This notice explains the risks of trading and investing through <Brand />. Please read it carefully.
        By using the platform you acknowledge that you understand and accept these risks.
      </p>

      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-bold text-ink mb-3 flex items-center gap-3">
            <TrendingDown className="w-6 h-6 text-accent" />
            1. Trading and Investing Involve Risk of Loss
          </h2>
          <p>
            Trading digital assets and other financial instruments carries a high level of risk and may not be
            suitable for everyone. Prices can move rapidly and unpredictably, and you may lose some or all of the
            funds you commit. You should not trade or invest with money you cannot afford to lose.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-ink mb-3 flex items-center gap-3">
            <History className="w-6 h-6 text-accent" />
            2. Past Performance Is Not Indicative of Future Results
          </h2>
          <p>
            Any performance figures, historical returns, trader statistics, or projected yields shown on <Brand />
            {" "}reflect past or hypothetical results. They are not a promise or guarantee of future performance.
            Returns can vary, and losses can occur regardless of prior results.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-ink mb-3 flex items-center gap-3">
            <Wallet className="w-6 h-6 text-accent" />
            3. Only Invest What You Can Afford to Lose
          </h2>
          <p>
            You are solely responsible for assessing whether a given product or strategy is appropriate for your
            financial situation, objectives, and risk tolerance. Never invest borrowed funds or money needed for
            essential living expenses. Consider your circumstances carefully before committing capital.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-ink mb-3 flex items-center gap-3">
            <Info className="w-6 h-6 text-accent" />
            4. No Financial Advice
          </h2>
          <p>
            <Brand /> provides tools, market information, and account services. It does not provide investment,
            financial, legal, or tax advice, and nothing on the platform should be interpreted as a recommendation
            to buy, sell, or hold any asset. You should seek advice from a qualified, independent professional
            before making financial decisions.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-ink mb-3 flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-accent" />
            5. Market Volatility and Digital Asset Risks
          </h2>
          <p>Digital asset markets carry additional risks, including but not limited to:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>High and sudden price volatility, including outside normal trading hours.</li>
            <li>Reduced liquidity, which may make it difficult to enter or exit positions at expected prices.</li>
            <li>Technological risks such as network disruptions, delays, or failures.</li>
            <li>The risk that an asset may lose most or all of its value.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-ink mb-3 flex items-center gap-3">
            <Globe2 className="w-6 h-6 text-accent" />
            6. Regulatory and Jurisdictional Considerations
          </h2>
          <p>
            The availability and treatment of certain products may vary by jurisdiction. You are responsible for
            ensuring that your use of <Brand /> complies with the laws and regulations that apply to you. Some
            services may not be available in your location.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-ink mb-3 flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-accent" />
            7. Do Your Own Research
          </h2>
          <p>
            Before using any feature or committing funds, take time to understand the product, its risks, and how
            it works. Make decisions based on your own judgment and independent research rather than on
            promotional material or the actions of other users.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-ink mb-3 flex items-center gap-3">
            <Mail className="w-6 h-6 text-accent" />
            8. Questions
          </h2>
          <p>
            If you have questions about the risks described here, contact our team before trading or investing.
          </p>
          <p className="mt-2">
            <a href={`mailto:${appSettings.supportEmail}`} className="text-accent hover:underline">
              {appSettings.supportEmail}
            </a>
          </p>
          <p className="mt-6 text-sm text-faint">
            This risk disclosure is provided for general information and should be read together with our{" "}
            <button type="button" onClick={() => onNavigate("terms")} className="text-accent hover:underline">Terms of Service</button>
            {" "}and{" "}
            <button type="button" onClick={() => onNavigate("privacy")} className="text-accent hover:underline">Privacy Policy</button>.
          </p>
        </section>
      </div>
    </motion.div>
  );
};
