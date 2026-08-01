import React, { useMemo, useState } from "react";
import { useAirdrops } from "../../../context/domains/AirdropsContext";
import { motion } from "motion/react";
import { Check, CheckCircle, Clock3, Edit3, Gift, PauseCircle, PlayCircle, Plus, Save, Trash2, X, XCircle } from "lucide-react";
import type { Airdrop } from "../../../types";
import { getCampaignClaimCount, isAirdropActive } from "../../../services";
import { formatDateTime } from "../../../lib/format";

type CampaignForm = {
  title: string;
  token: string;
  rewardAmount: string;
  claimLimit: string;
  startDate: string;
  endDate: string;
  eligibility: string;
  description: string;
  enabled: boolean;
};

const blankForm = (): CampaignForm => ({
  title: "",
  token: "",
  rewardAmount: "",
  claimLimit: "",
  startDate: new Date().toISOString().split("T")[0],
  endDate: "",
  eligibility: "All verified Moneta Prime members",
  description: "",
  enabled: true
});

const metricClass = "bg-surface border border-line rounded-xl p-4";

const statusClass = (status: string) => {
  if (status === "Approved") return "text-positive bg-positive/10 border-positive/30";
  if (status === "Rejected") return "text-negative bg-negative/10 border-negative/30";
  return "text-warning bg-warning-soft border-warning-line";
};

export const AdminAirdropsTab: React.FC = () => {
  const { airdrops, adminAirdropClaims, adminCreateAirdrop, adminUpdateAirdrop, adminDeleteAirdrop, adminApproveAirdrop, adminRejectAirdrop } = useAirdrops();

  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [busyClaim, setBusyClaim] = useState<string | null>(null);
  const [form, setForm] = useState<CampaignForm>(() => blankForm());

  const metrics = useMemo(() => ({
    total: adminAirdropClaims.length,
    pending: adminAirdropClaims.filter(claim => claim.status === "Pending").length,
    approved: adminAirdropClaims.filter(claim => claim.status === "Approved").length,
    rejected: adminAirdropClaims.filter(claim => claim.status === "Rejected").length
  }), [adminAirdropClaims]);

  const sortedClaims = useMemo(() => [...adminAirdropClaims].sort((a, b) => b.date.localeCompare(a.date)), [adminAirdropClaims]);

  const resetForm = () => {
    setForm(blankForm());
    setIsCreating(false);
    setEditingId(null);
  };

  const showFeedback = (message: string) => {
    setFeedback(message);
    window.setTimeout(() => setFeedback(null), 3500);
  };

  const formPayload = (existing?: Airdrop): Omit<Airdrop, "id"> => ({
    title: form.title,
    token: form.token,
    rewardAmount: form.rewardAmount,
    status: form.enabled ? "active" : "disabled",
    enabled: form.enabled,
    claimLimit: form.claimLimit ? Number(form.claimLimit) : undefined,
    startDate: form.startDate,
    endDate: form.endDate,
    eligibility: form.eligibility,
    description: form.description,
    createdAt: existing?.createdAt
  });

  const handleCreate = async () => {
    if (!form.title.trim() || !form.token.trim() || !form.rewardAmount.trim()) {
      showFeedback("Title, token, and reward amount are required.");
      return;
    }
    await adminCreateAirdrop(formPayload());
    showFeedback(`Created campaign: ${form.title}`);
    resetForm();
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    const existing = airdrops.find(a => a.id === editingId);
    if (!existing) return;
    await adminUpdateAirdrop({ ...existing, ...formPayload(existing) });
    showFeedback(`Updated campaign: ${form.title}`);
    resetForm();
  };

  const startEdit = (airdrop: Airdrop) => {
    setEditingId(airdrop.id);
    setIsCreating(false);
    setForm({
      title: airdrop.title,
      token: airdrop.token,
      rewardAmount: airdrop.rewardAmount,
      claimLimit: airdrop.claimLimit?.toString() || "",
      startDate: airdrop.startDate || new Date().toISOString().split("T")[0],
      endDate: airdrop.endDate || "",
      eligibility: airdrop.eligibility || "All verified Moneta Prime members",
      description: airdrop.description || "",
      enabled: airdrop.enabled !== false && airdrop.status !== "disabled"
    });
  };

  const toggleCampaign = async (airdrop: Airdrop) => {
    const enabled = !(airdrop.enabled !== false && airdrop.status !== "disabled");
    await adminUpdateAirdrop({ ...airdrop, enabled, status: enabled ? "active" : "disabled" });
    showFeedback(`${enabled ? "Enabled" : "Disabled"} ${airdrop.title}.`);
  };

  const reviewClaim = async (claimId: string, action: "approve" | "reject") => {
    setBusyClaim(claimId);
    try {
      if (action === "approve") await adminApproveAirdrop(claimId);
      else await adminRejectAirdrop(claimId);
      showFeedback(`Claim ${action === "approve" ? "approved" : "rejected"}.`);
    } finally {
      setBusyClaim(null);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="space-y-6">
      <div className="bg-surface border border-line rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-ink flex items-center gap-2">
            <Gift size={20} className="text-accent" /> Airdrop Campaigns
          </h1>
          <p className="text-xs text-muted mt-1">Manage campaign availability, claim review, and wallet-credit approvals.</p>
        </div>
        <button onClick={() => { setIsCreating(true); setEditingId(null); setForm(blankForm()); }} className="flex items-center gap-2 px-4 py-2 bg-accent text-ground font-bold text-xs uppercase rounded-lg hover:opacity-90 cursor-pointer">
          <Plus size={14} /> Campaign
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className={metricClass}><p className="text-2xs uppercase text-muted font-bold">Total Claims</p><p className="text-2xl font-bold text-ink mt-1">{metrics.total}</p></div>
        <div className={metricClass}><p className="text-2xs uppercase text-muted font-bold">Pending</p><p className="text-2xl font-bold text-warning mt-1">{metrics.pending}</p></div>
        <div className={metricClass}><p className="text-2xs uppercase text-muted font-bold">Approved</p><p className="text-2xl font-bold text-positive mt-1">{metrics.approved}</p></div>
        <div className={metricClass}><p className="text-2xs uppercase text-muted font-bold">Rejected</p><p className="text-2xl font-bold text-negative mt-1">{metrics.rejected}</p></div>
      </div>

      {feedback && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 rounded-xl bg-positive/10 border border-positive/30 text-positive text-xs font-bold flex items-center gap-2">
          <Check size={14} /> {feedback}
        </motion.div>
      )}

      {(isCreating || editingId) && (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="bg-surface border border-accent/30 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-ink">{isCreating ? "Create Campaign" : "Edit Campaign"}</h3>
            <button title="Close" onClick={resetForm} className="p-1.5 rounded-lg bg-line/50 text-muted hover:text-ink cursor-pointer"><X size={14} /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input placeholder="Campaign title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="px-3 py-2 bg-ground border border-line rounded-lg text-sm text-ink placeholder:text-muted focus:outline-none focus:border-accent" />
            <input placeholder="Token" value={form.token} onChange={e => setForm(f => ({ ...f, token: e.target.value }))} className="px-3 py-2 bg-ground border border-line rounded-lg text-sm text-ink placeholder:text-muted focus:outline-none focus:border-accent" />
            <input placeholder="Reward amount" value={form.rewardAmount} onChange={e => setForm(f => ({ ...f, rewardAmount: e.target.value }))} className="px-3 py-2 bg-ground border border-line rounded-lg text-sm text-ink placeholder:text-muted focus:outline-none focus:border-accent" />
            <input type="number" min="1" placeholder="Claim limit" value={form.claimLimit} onChange={e => setForm(f => ({ ...f, claimLimit: e.target.value }))} className="px-3 py-2 bg-ground border border-line rounded-lg text-sm text-ink placeholder:text-muted focus:outline-none focus:border-accent" />
            <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} className="px-3 py-2 bg-ground border border-line rounded-lg text-sm text-ink focus:outline-none focus:border-accent" />
            <input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} className="px-3 py-2 bg-ground border border-line rounded-lg text-sm text-ink focus:outline-none focus:border-accent" />
          </div>
          <input placeholder="Eligibility" value={form.eligibility} onChange={e => setForm(f => ({ ...f, eligibility: e.target.value }))} className="w-full px-3 py-2 bg-ground border border-line rounded-lg text-sm text-ink placeholder:text-muted focus:outline-none focus:border-accent" />
          <textarea placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="w-full min-h-20 px-3 py-2 bg-ground border border-line rounded-lg text-sm text-ink placeholder:text-muted focus:outline-none focus:border-accent" />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-xs font-bold text-ink">
              <input type="checkbox" checked={form.enabled} onChange={e => setForm(f => ({ ...f, enabled: e.target.checked }))} className="accent-accent" />
              Enabled for users
            </label>
            <button onClick={isCreating ? handleCreate : handleUpdate} className="flex items-center justify-center gap-2 px-6 py-2 bg-accent text-ground font-bold text-xs uppercase rounded-lg hover:opacity-90 cursor-pointer">
              <Save size={14} /> {isCreating ? "Create" : "Save"}
            </button>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {airdrops.map(airdrop => {
          const active = isAirdropActive(airdrop);
          const claimCount = getCampaignClaimCount(adminAirdropClaims, airdrop.id);
          return (
            <div key={airdrop.id} className="bg-surface border border-line rounded-2xl p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-ink">{airdrop.title}</h3>
                  <p className="text-2xs text-muted mt-1">{airdrop.description || airdrop.eligibility || "Campaign configured for airdrop claims."}</p>
                </div>
                <span className={`shrink-0 text-2xs font-bold px-2 py-0.5 rounded-full border ${active ? "bg-positive/10 border-positive/30 text-positive" : "bg-line/40 border-line text-muted"}`}>{active ? "ACTIVE" : "INACTIVE"}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-2xs">
                <div><span className="text-muted">Token:</span> <span className="text-accent font-bold ml-1">{airdrop.token}</span></div>
                <div><span className="text-muted">Reward:</span> <span className="text-ink font-bold ml-1">{airdrop.rewardAmount}</span></div>
                <div><span className="text-muted">Claims:</span> <span className="text-ink font-bold ml-1">{claimCount}{airdrop.claimLimit ? `/${airdrop.claimLimit}` : ""}</span></div>
                <div><span className="text-muted">Dates:</span> <span className="text-ink font-bold ml-1">{airdrop.startDate || "Now"} - {airdrop.endDate || "Open"}</span></div>
              </div>
              <div className="flex gap-2 pt-2 border-t border-line/50">
                <button title={active ? "Disable" : "Enable"} onClick={() => toggleCampaign(airdrop)} className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-line/40 border border-line text-ink text-2xs font-bold rounded-lg hover:border-accent/40 cursor-pointer">
                  {active ? <PauseCircle size={12} /> : <PlayCircle size={12} />}
                </button>
                <button onClick={() => startEdit(airdrop)} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-accent/10 border border-accent/30 text-accent text-2xs font-bold rounded-lg hover:bg-accent/20 cursor-pointer">
                  <Edit3 size={10} /> Edit
                </button>
                <button title="Delete" onClick={() => { if (window.confirm(`Delete "${airdrop.title}"?`)) adminDeleteAirdrop(airdrop.id); }} className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-negative/10 border border-negative/30 text-negative text-2xs font-bold rounded-lg hover:bg-negative/20 cursor-pointer">
                  <Trash2 size={10} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-surface border border-line rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-line flex items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-ink flex items-center gap-2"><Clock3 size={16} className="text-accent" /> Claim Review</h3>
          <span className="text-2xs text-muted">{sortedClaims.length} records</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[760px]">
            <thead className="bg-ground/60 text-2xs uppercase text-muted">
              <tr>
                <th className="px-5 py-3">User</th>
                <th className="px-4 py-3">Campaign</th>
                <th className="px-4 py-3">Reward</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {sortedClaims.map(claim => (
                <tr key={claim.id} className="hover:bg-ground/30 transition-colors">
                  <td className="px-5 py-4"><p className="text-xs font-bold text-ink">{claim.userName || claim.userEmail.split("@")[0]}</p><p className="text-2xs text-muted">{claim.userEmail}</p></td>
                  <td className="px-4 py-4 text-xs text-ink">{claim.campaignTitle || airdrops.find(item => item.id === claim.airdropId)?.title || claim.airdropId}</td>
                  <td className="px-4 py-4 text-xs font-bold text-accent">{claim.rewardAmount} {claim.token}</td>
                  <td className="px-4 py-4 text-xs text-muted">{formatDateTime(claim.date)}</td>
                  <td className="px-4 py-4"><span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-2xs font-bold ${statusClass(claim.status)}`}>{claim.status === "Approved" ? <CheckCircle size={11} /> : claim.status === "Rejected" ? <XCircle size={11} /> : <Clock3 size={11} />} {claim.status}</span></td>
                  <td className="px-5 py-4">
                    {claim.status === "Pending" ? (
                      <div className="flex justify-end gap-2">
                        <button disabled={busyClaim === claim.id} onClick={() => reviewClaim(claim.id, "approve")} className="flex items-center gap-1.5 px-3 py-2 bg-positive text-ink font-bold text-2xs uppercase rounded-lg hover:bg-positive disabled:opacity-60 cursor-pointer"><Check size={12} /> Approve</button>
                        <button disabled={busyClaim === claim.id} onClick={() => reviewClaim(claim.id, "reject")} className="flex items-center gap-1.5 px-3 py-2 bg-negative text-ink font-bold text-2xs uppercase rounded-lg hover:bg-negative disabled:opacity-60 cursor-pointer"><X size={12} /> Reject</button>
                      </div>
                    ) : (
                      <p className="text-right text-2xs text-muted">{claim.payoutTransactionId ? `Paid: ${claim.payoutTransactionId}` : claim.reviewedAt || "Reviewed"}</p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!sortedClaims.length && <div className="py-12 text-center text-sm text-muted">No airdrop claims submitted yet.</div>}
      </div>
    </motion.div>
  );
};
