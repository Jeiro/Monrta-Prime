import React, { useMemo, useRef, useState } from "react";
import { useWallet } from "../../../context/domains/WalletContext";
import { useSupabaseClient, uploadDepositWalletQrCode } from "../../../lib/supabase";
import { getDepositWalletLabel, sortDepositWallets } from "../../../services";
import type { DepositWallet } from "../../../types";
import { motion } from "motion/react";
import { Check, Copy, CreditCard, Edit3, Plus, QrCode, Save, Trash2 } from "lucide-react";
import { Button, Input, Textarea } from "../../ui";

type WalletForm = {
  id: string;
  coinName: string;
  network: string;
  walletAddress: string;
  destinationTag: string;
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
  destinationTag: "",
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
  destinationTag: wallet.destinationTag || "",
  qrCodeUrl: wallet.qrCodeUrl,
  minimumDeposit: String(wallet.minimumDeposit),
  enabled: wallet.enabled,
  displayOrder: String(wallet.displayOrder),
  depositInstructions: wallet.depositInstructions
});

export const AdminWalletsTab: React.FC = () => {
  const { depositWallets, adminSaveDepositWallet, adminDeleteDepositWallet } = useWallet();
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
        // Trimmed so a stray space cannot masquerade as a configured tag —
        // the deposit screen decides between "show the tag" and "contact
        // support" purely on this being empty.
        destinationTag: form.destinationTag.trim(),
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
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 rounded-xl bg-positive/10 border border-positive/30 text-positive text-xs font-bold flex items-center gap-2">
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
            <Button type="button" variant="ghost" size="sm" onClick={resetForm}>New Wallet</Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input label="Coin name" value={form.coinName} onChange={e => setForm(prev => ({ ...prev, coinName: e.target.value }))} placeholder="e.g. USDT" />
          <Input label="Network" value={form.network} onChange={e => setForm(prev => ({ ...prev, network: e.target.value }))} placeholder="e.g. TRC20" />
          <Input label="Minimum deposit" value={form.minimumDeposit} onChange={e => setForm(prev => ({ ...prev, minimumDeposit: e.target.value }))} type="number" min="0" prefix="$" numeric placeholder="0" />
          <Input label="Display order" value={form.displayOrder} onChange={e => setForm(prev => ({ ...prev, displayOrder: e.target.value }))} type="number" numeric placeholder="0" />
        </div>

        <Input label="Wallet address" value={form.walletAddress} onChange={e => setForm(prev => ({ ...prev, walletAddress: e.target.value }))} placeholder="Wallet Address" className="font-data" />
        <Input
          label="Destination tag (optional — XRP and similar coins only)"
          value={form.destinationTag}
          onChange={e => setForm(prev => ({ ...prev, destinationTag: e.target.value }))}
          placeholder="Leave blank unless this coin requires one"
          className="font-data"
          hint="Shown to users beside the deposit address. Leave blank for coins that do not use a tag — users will be told to contact support instead of being shown a made-up value."
        />
        <Input label="QR code URL" value={form.qrCodeUrl} onChange={e => setForm(prev => ({ ...prev, qrCodeUrl: e.target.value }))} placeholder="QR Code URL" />

        {/* Raw file input on purpose: it is visually hidden and only ever
            clicked programmatically by the button below. Input would wrap it
            in a labelled field wrapper, which is exactly what must not render. */}
        <input ref={fileInputRef} type="file" accept="image/*" onChange={e => setQrFile(e.target.files?.[0] || null)} className="hidden" />
        <Button
          type="button"
          variant="secondary"
          block
          icon={QrCode}
          onClick={() => fileInputRef.current?.click()}
          className="h-auto border-dashed py-3 text-xs font-medium text-muted"
        >
          {qrFile ? qrFile.name : "Upload or Change QR Code"}
        </Button>

        <Textarea label="Deposit instructions" value={form.depositInstructions} onChange={e => setForm(prev => ({ ...prev, depositInstructions: e.target.value }))} rows={3} placeholder="Deposit Instructions" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Raw checkbox: no Checkbox primitive yet — see AdminInvestmentsTab. */}
          <label className="flex items-center gap-2 text-xs text-ink cursor-pointer">
            <input type="checkbox" checked={form.enabled} onChange={e => setForm(prev => ({ ...prev, enabled: e.target.checked }))} className="accent-accent" />
            Enabled
          </label>
          <Button type="submit" loading={isSaving} icon={Save}>Save Wallet</Button>
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
                    <span className={`text-2xs px-2 py-0.5 rounded-full border ${wallet.enabled ? "border-positive/30 bg-positive/10 text-positive" : "border-negative/30 bg-negative/10 text-negative"}`}>
                      {wallet.enabled ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                  <p className="text-2xs text-muted">Min ${wallet.minimumDeposit.toLocaleString()} | Order {wallet.displayOrder}</p>
                  <p className="text-xs text-ink font-mono break-all">{wallet.walletAddress}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button type="button" variant="secondary" size="icon" onClick={() => handleCopy(wallet)} title="Copy address" aria-label={`Copy ${getDepositWalletLabel(wallet)} address`}>
                    {copiedKey === wallet.id ? <Check size={14} className="text-positive" /> : <Copy size={14} />}
                  </Button>
                  <Button type="button" variant="secondary" size="icon" onClick={() => setForm(walletToForm(wallet))} title="Edit wallet" aria-label={`Edit ${getDepositWalletLabel(wallet)}`}>
                    <Edit3 size={14} />
                  </Button>
                  <Button type="button" variant="secondary" size="sm" onClick={() => handleToggle(wallet)}>
                    {wallet.enabled ? "Disable" : "Enable"}
                  </Button>
                  <Button type="button" variant="secondary" size="icon" onClick={() => handleDelete(wallet)} title="Delete wallet" aria-label={`Delete ${getDepositWalletLabel(wallet)}`} className="hover:text-negative hover:border-negative/50">
                    <Trash2 size={14} />
                  </Button>
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
