import React, { useMemo, useRef, useState } from "react";
import { useApp } from "../../../context/AppContext";
import { useSupabaseClient, uploadDepositWalletQrCode } from "../../../lib/supabase";
import { getDepositWalletLabel, sortDepositWallets } from "../../../services";
import type { DepositWallet } from "../../../types";
import { motion } from "motion/react";
import { Check, Copy, CreditCard, Edit3, Plus, QrCode, Save, Trash2 } from "lucide-react";

type WalletForm = {
  id: string;
  coinName: string;
  network: string;
  walletAddress: string;
  qrCodeUrl: string;
  minimumDeposit: string;
  enabled: boolean;
  displayOrder: string;
  depositInstructions: string;
};

const createEmptyForm = (): WalletForm => ({
  id: "",
  coinName: "",
  network: "",
  walletAddress: "",
  qrCodeUrl: "",
  minimumDeposit: "100",
  enabled: true,
  displayOrder: "0",
  depositInstructions: "Send only the selected coin and network to this address. Credits are reviewed after network confirmation."
});

const walletToForm = (wallet: DepositWallet): WalletForm => ({
  id: wallet.id,
  coinName: wallet.coinName,
  network: wallet.network,
  walletAddress: wallet.walletAddress,
  qrCodeUrl: wallet.qrCodeUrl,
  minimumDeposit: String(wallet.minimumDeposit),
  enabled: wallet.enabled,
  displayOrder: String(wallet.displayOrder),
  depositInstructions: wallet.depositInstructions
});

export const AdminWalletsTab: React.FC = () => {
  const { depositWallets, adminSaveDepositWallet, adminDeleteDepositWallet } = useApp();
  const supabase = useSupabaseClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<WalletForm>(() => createEmptyForm());
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const sortedWallets = useMemo(() => sortDepositWallets(depositWallets), [depositWallets]);
  const isEditing = Boolean(form.id);

  const showFeedback = (message: string) => {
    setFeedback(message);
    setTimeout(() => setFeedback(null), 3000);
  };

  const resetForm = () => {
    setForm(createEmptyForm());
    setQrFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCopy = (wallet: DepositWallet) => {
    navigator.clipboard.writeText(wallet.walletAddress);
    setCopiedKey(wallet.id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.coinName.trim() || !form.network.trim() || !form.walletAddress.trim()) {
      showFeedback("Coin, network, and wallet address are required.");
      return;
    }

    setIsSaving(true);
    try {
      const walletId = form.id || `deposit-wallet-${Date.now()}`;
      let qrCodeUrl = form.qrCodeUrl.trim();

      if (qrFile) {
        qrCodeUrl = await uploadDepositWalletQrCode(supabase, walletId, qrFile);
      }

      await adminSaveDepositWallet({
        id: walletId,
        coinName: form.coinName,
        network: form.network,
        walletAddress: form.walletAddress,
        qrCodeUrl,
        minimumDeposit: parseFloat(form.minimumDeposit) || 0,
        enabled: form.enabled,
        displayOrder: parseInt(form.displayOrder, 10) || 0,
        depositInstructions: form.depositInstructions
      });

      resetForm();
      showFeedback("Deposit wallet saved successfully.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = async (wallet: DepositWallet) => {
    await adminSaveDepositWallet({ ...wallet, enabled: !wallet.enabled });
    showFeedback(`${getDepositWalletLabel(wallet)} ${wallet.enabled ? "disabled" : "enabled"}.`);
  };

  const handleDelete = async (wallet: DepositWallet) => {
    await adminDeleteDepositWallet(wallet.id);
    if (form.id === wallet.id) resetForm();
    showFeedback("Deposit wallet deleted.");
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="space-y-6">
      <div className="bg-surface border border-line rounded-2xl p-6">
        <h1 className="text-xl font-bold text-ink flex items-center gap-2">
          <CreditCard size={20} className="text-accent" /> Deposit Wallet Management
        </h1>
        <p className="text-xs text-muted mt-1">Manage coin networks, wallet addresses, QR codes, deposit limits, and display order.</p>
      </div>

      {feedback && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
          <Check size={14} /> {feedback}
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="bg-surface border border-line rounded-xl p-4 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-ink flex items-center gap-2">
            {isEditing ? <Edit3 size={15} className="text-accent" /> : <Plus size={15} className="text-accent" />}
            {isEditing ? "Edit Deposit Wallet" : "Add Deposit Wallet"}
          </h2>
          {isEditing && (
            <button type="button" onClick={resetForm} className="text-2xs text-muted hover:text-ink cursor-pointer">
              New Wallet
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input value={form.coinName} onChange={e => setForm(prev => ({ ...prev, coinName: e.target.value }))} placeholder="Coin Name e.g. USDT" className="w-full px-4 py-2.5 bg-ground border border-line rounded-lg text-xs text-ink focus:outline-none focus:border-accent" />
          <input value={form.network} onChange={e => setForm(prev => ({ ...prev, network: e.target.value }))} placeholder="Network e.g. TRC20" className="w-full px-4 py-2.5 bg-ground border border-line rounded-lg text-xs text-ink focus:outline-none focus:border-accent" />
          <input value={form.minimumDeposit} onChange={e => setForm(prev => ({ ...prev, minimumDeposit: e.target.value }))} type="number" min="0" placeholder="Minimum Deposit" className="w-full px-4 py-2.5 bg-ground border border-line rounded-lg text-xs text-ink focus:outline-none focus:border-accent" />
          <input value={form.displayOrder} onChange={e => setForm(prev => ({ ...prev, displayOrder: e.target.value }))} type="number" placeholder="Display Order" className="w-full px-4 py-2.5 bg-ground border border-line rounded-lg text-xs text-ink focus:outline-none focus:border-accent" />
        </div>

        <input value={form.walletAddress} onChange={e => setForm(prev => ({ ...prev, walletAddress: e.target.value }))} placeholder="Wallet Address" className="w-full px-4 py-2.5 bg-ground border border-line rounded-lg text-xs text-ink font-mono focus:outline-none focus:border-accent" />
        <input value={form.qrCodeUrl} onChange={e => setForm(prev => ({ ...prev, qrCodeUrl: e.target.value }))} placeholder="QR Code URL" className="w-full px-4 py-2.5 bg-ground border border-line rounded-lg text-xs text-ink focus:outline-none focus:border-accent" />

        <input ref={fileInputRef} type="file" accept="image/*" onChange={e => setQrFile(e.target.files?.[0] || null)} className="hidden" />
        <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full px-4 py-3 border border-dashed border-line rounded-xl text-xs text-muted hover:border-accent hover:text-accent transition-colors cursor-pointer flex items-center justify-center gap-2">
          <QrCode size={14} /> {qrFile ? qrFile.name : "Upload or Change QR Code"}
        </button>

        <textarea value={form.depositInstructions} onChange={e => setForm(prev => ({ ...prev, depositInstructions: e.target.value }))} rows={3} placeholder="Deposit Instructions" className="w-full px-4 py-2.5 bg-ground border border-line rounded-lg text-xs text-ink focus:outline-none focus:border-accent" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-xs text-ink cursor-pointer">
            <input type="checkbox" checked={form.enabled} onChange={e => setForm(prev => ({ ...prev, enabled: e.target.checked }))} className="accent-accent" />
            Enabled
          </label>
          <button type="submit" disabled={isSaving} className="flex items-center justify-center gap-2 px-8 py-3 bg-accent text-ground font-bold text-xs uppercase rounded-xl hover:opacity-90 disabled:opacity-60 cursor-pointer">
            <Save size={14} /> {isSaving ? "Saving..." : "Save Wallet"}
          </button>
        </div>
      </form>

      <div className="space-y-4">
        {sortedWallets.length === 0 ? (
          <div className="bg-surface border border-line rounded-xl p-6 text-center text-xs text-muted">
            No deposit wallets configured.
          </div>
        ) : (
          sortedWallets.map(wallet => (
            <div key={wallet.id} className="bg-surface border border-line rounded-xl p-4 space-y-3">
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-ink">{getDepositWalletLabel(wallet)}</h3>
                    <span className={`text-2xs px-2 py-0.5 rounded-full border ${wallet.enabled ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : "border-negative/30 bg-negative/10 text-negative"}`}>
                      {wallet.enabled ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                  <p className="text-2xs text-muted">Min ${wallet.minimumDeposit.toLocaleString()} | Order {wallet.displayOrder}</p>
                  <p className="text-xs text-ink font-mono break-all">{wallet.walletAddress}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button type="button" onClick={() => handleCopy(wallet)} className="p-2 rounded-lg bg-ground border border-line text-muted hover:text-accent hover:border-accent cursor-pointer" title="Copy address">
                    {copiedKey === wallet.id ? <Check size={14} className="text-positive" /> : <Copy size={14} />}
                  </button>
                  <button type="button" onClick={() => setForm(walletToForm(wallet))} className="p-2 rounded-lg bg-ground border border-line text-muted hover:text-accent hover:border-accent cursor-pointer" title="Edit wallet">
                    <Edit3 size={14} />
                  </button>
                  <button type="button" onClick={() => handleToggle(wallet)} className="px-3 py-2 rounded-lg bg-ground border border-line text-2xs text-muted hover:text-ink cursor-pointer">
                    {wallet.enabled ? "Disable" : "Enable"}
                  </button>
                  <button type="button" onClick={() => handleDelete(wallet)} className="p-2 rounded-lg bg-ground border border-line text-muted hover:text-negative hover:border-negative/50 cursor-pointer" title="Delete wallet">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {wallet.qrCodeUrl && (
                <div className="flex items-center gap-3 pt-2 border-t border-line/50">
                  <div className="w-16 h-16 rounded-lg bg-white p-1 shrink-0">
                    <img src={wallet.qrCodeUrl} alt={`${getDepositWalletLabel(wallet)} QR code`} className="w-full h-full object-contain" />
                  </div>
                  <p className="text-xs text-muted leading-relaxed">{wallet.depositInstructions}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
};
