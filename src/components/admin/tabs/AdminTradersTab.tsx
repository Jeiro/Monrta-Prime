import React, { useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { Award, Check, Edit3, ImagePlus, Plus, Save, Star, ToggleLeft, ToggleRight, Trash2, Upload, X } from "lucide-react";
import { useApp } from "../../../context/AppContext";
import type { TraderProfile } from "../../../types";

type TraderFormState = {
  name: string;
  avatar: string;
  active: boolean;
  featured: boolean;
  country: string;
  tradingStyle: string;
  markets: string;
  minimumCopyAmount: string;
  maximumCopyAmount: string;
  biography: string;
  displayOrder: string;
  roi: string;
  winRate: string;
  followers: string;
  maxFollowers: string;
  assetsUnderManagement: string;
  riskScore: string;
  profitDays: string;
};

const emptyForm: TraderFormState = {
  name: "",
  avatar: "",
  active: true,
  featured: false,
  country: "",
  tradingStyle: "",
  markets: "",
  minimumCopyAmount: "",
  maximumCopyAmount: "",
  biography: "",
  displayOrder: "",
  roi: "",
  winRate: "",
  followers: "",
  maxFollowers: "",
  assetsUnderManagement: "",
  riskScore: "",
  profitDays: ""
};

const numberValue = (value: string, fallback: number) => (value !== "" ? Number(value) : fallback);
const integerValue = (value: string, fallback: number) => (value !== "" ? parseInt(value, 10) : fallback);
const errorMessage = (error: unknown) => error instanceof Error ? error.message : "Unexpected error";

const moneyRange = (minimum?: number, maximum?: number) => {
  const min = minimum ?? 0;
  const max = maximum ?? 0;
  return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
};

export const AdminTradersTab: React.FC = () => {
  const { traders, adminUpdateTrader, adminCreateTrader, adminDeleteTrader } = useApp();

  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [form, setForm] = useState<TraderFormState>(emptyForm);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const sortedTraders = useMemo(
    () => [...traders].sort((a, b) => (a.displayOrder ?? 999) - (b.displayOrder ?? 999) || a.name.localeCompare(b.name)),
    [traders]
  );

  const tableStats = useMemo(() => ({
    total: traders.length,
    active: traders.filter(trader => trader.active ?? true).length,
    featured: traders.filter(trader => trader.featured ?? false).length
  }), [traders]);

  const setField = <K extends keyof TraderFormState>(key: K, value: TraderFormState[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const showFeedback = (message: string) => {
    setFeedback(message);
    setTimeout(() => setFeedback(null), 5000);
  };

  const resetForm = () => {
    setForm(emptyForm);
    setIsCreating(false);
    setEditingId(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const buildTraderPayload = (): Omit<TraderProfile, "id"> => ({
    name: form.name.trim(),
    avatar: form.avatar,
    active: form.active,
    featured: form.featured,
    country: form.country.trim(),
    tradingStyle: form.tradingStyle.trim(),
    markets: form.markets.trim(),
    minimumCopyAmount: numberValue(form.minimumCopyAmount, 0),
    maximumCopyAmount: numberValue(form.maximumCopyAmount, 0),
    biography: form.biography.trim(),
    displayOrder: integerValue(form.displayOrder, sortedTraders.length + 1),
    roi: numberValue(form.roi, 0),
    winRate: numberValue(form.winRate, 0),
    followers: integerValue(form.followers, 0),
    maxFollowers: integerValue(form.maxFollowers, 500),
    assetsUnderManagement: form.assetsUnderManagement.trim() || "$0",
    riskScore: integerValue(form.riskScore, 2),
    profitDays: integerValue(form.profitDays, 0),
    chartData: Array.from({ length: 10 }, () => Math.random() * 100)
  });

  const handleAvatarFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file (PNG, JPG, WEBP, etc.)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be smaller than 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = readerEvent => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const max = 256;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          height = (height / width) * max;
          width = max;
        } else {
          width = (width / height) * max;
          height = max;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.drawImage(img, 0, 0, width, height);
        setField("avatar", canvas.toDataURL("image/webp", 0.85));
      };
      img.src = readerEvent.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const startCreate = () => {
    resetForm();
    setForm({ ...emptyForm, displayOrder: (sortedTraders.length + 1).toString() });
    setIsCreating(true);
  };

  const startEdit = (trader: TraderProfile) => {
    setEditingId(trader.id);
    setIsCreating(false);
    setForm({
      name: trader.name,
      avatar: trader.avatar,
      active: trader.active ?? true,
      featured: trader.featured ?? false,
      country: trader.country ?? "",
      tradingStyle: trader.tradingStyle ?? "",
      markets: trader.markets ?? "",
      minimumCopyAmount: (trader.minimumCopyAmount ?? "").toString(),
      maximumCopyAmount: (trader.maximumCopyAmount ?? "").toString(),
      biography: trader.biography ?? "",
      displayOrder: (trader.displayOrder ?? "").toString(),
      roi: (trader.roi ?? 0).toString(),
      winRate: (trader.winRate ?? 0).toString(),
      followers: (trader.followers ?? 0).toString(),
      maxFollowers: (trader.maxFollowers ?? 500).toString(),
      assetsUnderManagement: trader.assetsUnderManagement || "$0",
      riskScore: (trader.riskScore ?? 2).toString(),
      profitDays: (trader.profitDays ?? 0).toString()
    });
  };

  const handleCreate = async () => {
    if (!form.name.trim() || !form.avatar) {
      alert("Please enter a name and upload a profile photo.");
      return;
    }

    try {
      await adminCreateTrader(buildTraderPayload());
      showFeedback(`Created trader: ${form.name}`);
      resetForm();
    } catch (error) {
      showFeedback(`Failed to create trader: ${errorMessage(error)}`);
    }
  };

  const handleUpdate = async () => {
    if (!editingId) return;

    try {
      const currentTrader = traders.find(trader => trader.id === editingId);
      await adminUpdateTrader(editingId, {
        ...buildTraderPayload(),
        chartData: currentTrader?.chartData ?? []
      });
      showFeedback(`Updated trader: ${form.name}`);
      resetForm();
    } catch (error) {
      showFeedback(`Failed to update trader: ${errorMessage(error)}`);
    }
  };

  const toggleTraderField = async (trader: TraderProfile, field: "active" | "featured") => {
    const nextValue = !(trader[field] ?? field === "active");
    try {
      await adminUpdateTrader(trader.id, { [field]: nextValue });
      showFeedback(`${trader.name} ${field} set to ${nextValue ? "on" : "off"}.`);
    } catch (error) {
      showFeedback(`Failed to update ${trader.name}: ${errorMessage(error)}`);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="space-y-6">
      <div className="bg-surface border border-line rounded-2xl p-6 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-5">
        <div>
          <h1 className="text-xl font-bold text-ink flex items-center gap-2">
            <Award size={20} className="text-accent" /> Trader Management
          </h1>
          <p className="text-xs text-muted mt-1">Manage copy trading profiles, visibility, allocation limits, and platform ranking.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="grid grid-cols-3 gap-2 text-center">
            <StatBadge label="Total" value={tableStats.total} />
            <StatBadge label="Active" value={tableStats.active} tone="green" />
            <StatBadge label="Featured" value={tableStats.featured} tone="accent" />
          </div>
          <button onClick={startCreate} className="flex items-center gap-2 px-4 py-2 bg-accent text-ground font-bold text-xs uppercase rounded-lg hover:opacity-90 cursor-pointer">
            <Plus size={14} /> Add Trader
          </button>
        </div>
      </div>

      {feedback && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 rounded-xl bg-positive/10 border border-positive/30 text-positive text-xs font-bold flex items-center gap-2">
          <Check size={14} /> {feedback}
        </motion.div>
      )}

      {(isCreating || editingId) && (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="bg-surface border border-accent/30 rounded-2xl p-6 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-ink">{isCreating ? "Add New Trader" : "Edit Trader Profile"}</h3>
              <p className="text-2xs text-muted mt-1">Update the fields shown to admins and copied into the trader record.</p>
            </div>
            <button onClick={resetForm} className="p-1.5 rounded-lg bg-line/50 text-muted hover:text-ink cursor-pointer" aria-label="Close trader form">
              <X size={14} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            <TextInput placeholder="Name" value={form.name} onChange={value => setField("name", value)} />
            <TextInput placeholder="Country" value={form.country} onChange={value => setField("country", value)} />
            <TextInput placeholder="Trading Style" value={form.tradingStyle} onChange={value => setField("tradingStyle", value)} />
            <TextInput placeholder="Markets (Crypto, Forex, Stocks)" value={form.markets} onChange={value => setField("markets", value)} />

            <div className="flex items-center gap-3 px-3 py-1.5 bg-ground border border-line rounded-lg">
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarFileChange} className="hidden" id="trader-avatar-upload" />
              {form.avatar ? (
                <img src={form.avatar} alt="Avatar preview" className="w-8 h-8 rounded-full object-cover border-2 border-accent/40 flex-shrink-0" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-line/50 flex items-center justify-center flex-shrink-0">
                  <ImagePlus size={14} className="text-muted" />
                </div>
              )}
              <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1.5 text-xs text-accent font-semibold hover:text-ink transition-colors cursor-pointer truncate">
                <Upload size={12} />
                {form.avatar ? "Change Photo" : "Upload Photo"}
              </button>
            </div>
            <NumberInput placeholder="ROI %" value={form.roi} onChange={value => setField("roi", value)} />
            <NumberInput placeholder="Win Rate %" value={form.winRate} onChange={value => setField("winRate", value)} />
            <NumberInput placeholder="Risk Score (1-5)" value={form.riskScore} onChange={value => setField("riskScore", value)} />

            <NumberInput placeholder="Followers" value={form.followers} onChange={value => setField("followers", value)} />
            <NumberInput placeholder="Max Followers" value={form.maxFollowers} onChange={value => setField("maxFollowers", value)} />
            <TextInput placeholder="AUM (e.g. $1.4M)" value={form.assetsUnderManagement} onChange={value => setField("assetsUnderManagement", value)} />
            <NumberInput placeholder="Profit Days" value={form.profitDays} onChange={value => setField("profitDays", value)} />

            <NumberInput placeholder="Minimum Copy Amount" value={form.minimumCopyAmount} onChange={value => setField("minimumCopyAmount", value)} />
            <NumberInput placeholder="Maximum Copy Amount" value={form.maximumCopyAmount} onChange={value => setField("maximumCopyAmount", value)} />
            <NumberInput placeholder="Display Order" value={form.displayOrder} onChange={value => setField("displayOrder", value)} />
            <div className="grid grid-cols-2 gap-2">
              <ToggleButton label="Active" enabled={form.active} onClick={() => setField("active", !form.active)} />
              <ToggleButton label="Featured" enabled={form.featured} onClick={() => setField("featured", !form.featured)} />
            </div>
          </div>

          <textarea placeholder="Biography" rows={4} value={form.biography} onChange={event => setField("biography", event.target.value)} className="w-full px-3 py-2 bg-ground border border-line rounded-lg text-sm text-ink placeholder:text-muted focus:outline-none focus:border-accent resize-none" />

          <div className="flex flex-wrap gap-3">
            <button onClick={isCreating ? handleCreate : handleUpdate} className="flex items-center gap-2 px-6 py-2 bg-accent text-ground font-bold text-xs uppercase rounded-lg hover:opacity-90 cursor-pointer">
              <Save size={14} /> {isCreating ? "Create Trader" : "Save Changes"}
            </button>
            <button onClick={resetForm} className="flex items-center gap-2 px-5 py-2 bg-line/60 text-ink font-bold text-xs uppercase rounded-lg hover:bg-line cursor-pointer">
              <X size={14} /> Cancel
            </button>
          </div>
        </motion.div>
      )}

      <div className="bg-surface border border-line rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-line flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-ink">Trader Directory</h2>
            <p className="text-2xs text-muted mt-1">Inline visibility controls with editable profile details.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1120px] text-left">
            <thead className="bg-ground/60 border-b border-line">
              <tr className="text-2xs uppercase tracking-wider text-muted">
                <th className="px-5 py-3 font-bold">Trader</th>
                <th className="px-4 py-3 font-bold">Status</th>
                <th className="px-4 py-3 font-bold">Featured</th>
                <th className="px-4 py-3 font-bold">Country</th>
                <th className="px-4 py-3 font-bold">Style / Markets</th>
                <th className="px-4 py-3 font-bold">Performance</th>
                <th className="px-4 py-3 font-bold">Followers</th>
                <th className="px-4 py-3 font-bold">Copy Range</th>
                <th className="px-4 py-3 font-bold">Order</th>
                <th className="px-5 py-3 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/70">
              {sortedTraders.map(trader => (
                <tr key={trader.id} className="hover:bg-ground/40 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <img src={trader.avatar} alt={trader.name} className="w-10 h-10 rounded-full object-cover border-2 border-accent/30" />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-ink truncate">{trader.name}</p>
                        <p className="text-2xs text-muted">{trader.assetsUnderManagement || "$0"} AUM</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <TableToggle enabled={trader.active ?? true} onClick={() => toggleTraderField(trader, "active")} onText="Active" offText="Inactive" />
                  </td>
                  <td className="px-4 py-4">
                    <TableToggle enabled={trader.featured ?? false} onClick={() => toggleTraderField(trader, "featured")} onText="Featured" offText="Standard" />
                  </td>
                  <td className="px-4 py-4 text-xs text-ink">{trader.country || "Not set"}</td>
                  <td className="px-4 py-4">
                    <p className="text-xs font-bold text-ink">{trader.tradingStyle || "Not set"}</p>
                    <p className="text-2xs text-muted mt-0.5">{trader.markets || "Markets not set"}</p>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3 text-2xs">
                      <span className="font-bold text-positive">{trader.roi ?? 0}% ROI</span>
                      <span className="text-ink">{trader.winRate ?? 0}% win</span>
                      <span className="text-accent">R{trader.riskScore ?? 2}</span>
                    </div>
                    <p className="text-2xs text-muted mt-1">{trader.profitDays ?? 0} profit days</p>
                  </td>
                  <td className="px-4 py-4 text-xs text-ink font-bold">{trader.followers ?? 0}<span className="text-muted font-normal"> / {trader.maxFollowers ?? 500}</span></td>
                  <td className="px-4 py-4 text-xs text-ink">{moneyRange(trader.minimumCopyAmount, trader.maximumCopyAmount)}</td>
                  <td className="px-4 py-4 text-xs text-accent font-bold">{trader.displayOrder ?? "-"}</td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => startEdit(trader)} className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-accent/10 border border-accent/30 text-accent text-2xs font-bold rounded-lg hover:bg-accent/20 cursor-pointer">
                        <Edit3 size={10} /> Edit
                      </button>
                      <button onClick={() => { if (window.confirm(`Delete \"${trader.name}\"?`)) void adminDeleteTrader(trader.id); }} className="flex items-center justify-center px-3 py-1.5 bg-negative/10 border border-negative/30 text-negative rounded-lg hover:bg-negative/20 cursor-pointer" aria-label={`Delete ${trader.name}`}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};

const inputClass = "px-3 py-2 bg-ground border border-line rounded-lg text-sm text-ink placeholder:text-muted focus:outline-none focus:border-accent";

const TextInput: React.FC<{ placeholder: string; value: string; onChange: (value: string) => void }> = ({ placeholder, value, onChange }) => (
  <input placeholder={placeholder} value={value} onChange={event => onChange(event.target.value)} className={inputClass} />
);

const NumberInput: React.FC<{ placeholder: string; value: string; onChange: (value: string) => void }> = ({ placeholder, value, onChange }) => (
  <input type="number" placeholder={placeholder} value={value} onChange={event => onChange(event.target.value)} className={inputClass} />
);

const StatBadge: React.FC<{ label: string; value: number; tone?: "default" | "green" | "accent" }> = ({ label, value, tone = "default" }) => {
  const toneClass = tone === "green"
    ? "bg-positive/10 border-positive/20 text-positive"
    : tone === "accent"
      ? "bg-accent/10 border-accent/20 text-accent"
      : "bg-ground border-line text-ink";

  return (
    <div className={`px-3 py-2 border rounded-lg ${toneClass}`}>
      <p className="text-2xs uppercase text-muted tracking-wider">{label}</p>
      <p className="text-sm font-bold">{value}</p>
    </div>
  );
};

const ToggleButton: React.FC<{ label: string; enabled: boolean; onClick: () => void }> = ({ label, enabled, onClick }) => (
  <button type="button" onClick={onClick} className={`flex items-center justify-center gap-1.5 px-3 py-2 border rounded-lg text-2xs font-bold cursor-pointer ${enabled ? "bg-positive/10 border-positive/30 text-positive" : "bg-ground border-line text-muted"}`}>
    {enabled ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
    {label}
  </button>
);

const TableToggle: React.FC<{ enabled: boolean; onClick: () => void; onText: string; offText: string }> = ({ enabled, onClick, onText, offText }) => (
  <button type="button" onClick={onClick} className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-2xs font-bold cursor-pointer ${enabled ? "bg-positive/10 border-positive/30 text-positive" : "bg-ground border-line text-muted"}`}>
    {enabled ? <ToggleRight size={13} /> : <ToggleLeft size={13} />}
    {enabled ? onText : offText}
    {enabled && onText === "Featured" ? <Star size={11} /> : null}
  </button>
);
