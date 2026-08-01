import React, { useMemo, useState } from "react";
import { useAirdrops } from "../../../context/domains/AirdropsContext";
import { motion } from "motion/react";
import { Check, CheckCircle, Clock3, Edit3, Gift, PauseCircle, PlayCircle, Plus, Save, Trash2, X, XCircle } from "lucide-react";
import type { Airdrop } from "../../../types";
import { getCampaignClaimCount, isAirdropActive } from "../../../services";
import { formatDateTime } from "../../../lib/format";
import { Button, Input, Textarea, DataTable, type Column } from "../../ui";
import type { AirdropClaim } from "../../../types";

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

  const claimColumns: Column<AirdropClaim>[] = [
    {
      key: "user",
      header: "User",
      primary: true,
      cell: claim => (
        <>
          <p className="text-xs font-bold text-ink">{claim.userName || claim.userEmail.split("@")[0]}</p>
          <p className="text-2xs text-muted">{claim.userEmail}</p>
        </>
      )
    },
    {
      key: "campaign",
      header: "Campaign",
      cell: claim => claim.campaignTitle || airdrops.find(item => item.id === claim.airdropId)?.title || claim.airdropId
    },
    {
      key: "reward",
      header: "Reward",
      cell: claim => <span className="font-bold text-accent">{claim.rewardAmount} {claim.token}</span>
    },
    {
      key: "date",
      header: "Date",
      hideOnMobile: true,
      cell: claim => <span className="text-muted">{formatDateTime(claim.date)}</span>
    },
    {
      key: "status",
      header: "Status",
      cell: claim => (
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-2xs font-bold ${statusClass(claim.status)}`}>
          {claim.status === "Approved" ? <CheckCircle size={11} /> : claim.status === "Rejected" ? <XCircle size={11} /> : <Clock3 size={11} />} {claim.status}
        </span>
      )
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      cell: claim => claim.status === "Pending" ? (
        <div className="flex justify-end gap-2">
          <Button variant="positive" size="sm" icon={Check} disabled={busyClaim === claim.id} onClick={() => reviewClaim(claim.id, "approve")}>Approve</Button>
          <Button variant="danger" size="sm" icon={X} disabled={busyClaim === claim.id} onClick={() => reviewClaim(claim.id, "reject")}>Reject</Button>
        </div>
      ) : (
        <p className="text-2xs text-muted">{claim.payoutTransactionId ? `Paid: ${claim.payoutTransactionId}` : claim.reviewedAt || "Reviewed"}</p>
      )
    }
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="space-y-6">
      <div className="bg-surface border border-line rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-ink flex items-center gap-2">
            <Gift size={20} className="text-accent" /> Airdrop Campaigns
          </h1>
          <p className="text-xs text-muted mt-1">Manage campaign availability, claim review, and wallet-credit approvals.</p>
        </div>
        <Button icon={Plus} onClick={() => { setIsCreating(true); setEditingId(null); setForm(blankForm()); }}>Campaign</Button>
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
            <Button variant="ghost" size="icon" title="Close" aria-label="Close campaign form" onClick={resetForm}><X size={14} /></Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input label="Campaign title" placeholder="Campaign title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            <Input label="Token" placeholder="Token" value={form.token} onChange={e => setForm(f => ({ ...f, token: e.target.value }))} />
            <Input label="Reward amount" placeholder="Reward amount" value={form.rewardAmount} onChange={e => setForm(f => ({ ...f, rewardAmount: e.target.value }))} />
            <Input label="Claim limit" type="number" min="1" numeric placeholder="Unlimited" value={form.claimLimit} onChange={e => setForm(f => ({ ...f, claimLimit: e.target.value }))} />
            <Input label="Start date" type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
            <Input label="End date" type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
          </div>
          <Input label="Eligibility" placeholder="Eligibility" value={form.eligibility} onChange={e => setForm(f => ({ ...f, eligibility: e.target.value }))} />
          <Textarea label="Description" rows={3} placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Raw checkbox: no Checkbox primitive yet — see AdminInvestmentsTab. */}
            <label className="flex items-center gap-2 text-xs font-bold text-ink">
              <input type="checkbox" checked={form.enabled} onChange={e => setForm(f => ({ ...f, enabled: e.target.checked }))} className="accent-accent" />
              Enabled for users
            </label>
            <Button icon={Save} onClick={isCreating ? handleCreate : handleUpdate}>{isCreating ? "Create" : "Save"}</Button>
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
                <Button variant="secondary" size="sm" title={active ? "Disable" : "Enable"} aria-label={`${active ? "Disable" : "Enable"} ${airdrop.title}`} onClick={() => toggleCampaign(airdrop)}>
                  {active ? <PauseCircle size={12} /> : <PlayCircle size={12} />}
                </Button>
                <Button variant="secondary" size="sm" icon={Edit3} className="flex-1" onClick={() => startEdit(airdrop)}>Edit</Button>
                <Button variant="danger" size="sm" title="Delete" aria-label={`Delete ${airdrop.title}`} onClick={() => { if (window.confirm(`Delete "${airdrop.title}"?`)) adminDeleteAirdrop(airdrop.id); }}>
                  <Trash2 size={12} />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-ink flex items-center gap-2"><Clock3 size={16} className="text-accent" /> Claim Review</h3>
          <span className="text-2xs text-muted">{sortedClaims.length} records</span>
        </div>
        <DataTable
          columns={claimColumns}
          rows={sortedClaims}
          rowKey={claim => claim.id}
          caption="Airdrop claim review"
          empty={{ icon: Gift, title: "No airdrop claims submitted yet." }}
        />
      </div>

    </motion.div>
  );
};
