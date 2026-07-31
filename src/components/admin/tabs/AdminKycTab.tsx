import React, { useMemo, useState } from "react";
import { useApp } from "../../../context/AppContext";
import { motion } from "motion/react";
import { UserCheck, Check, X, Search, Eye, FileText, ExternalLink } from "lucide-react";
import type { KycSubmission, KycStatus } from "../../../types";
import type { CoreUserProfile } from "../../../hooks/data/useUsersDirectory";

type KycRow = CoreUserProfile & { kyc?: KycSubmission; kycStatus: KycStatus };

const statusColors: Record<KycStatus, string> = {
  pending: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
  approved: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  rejected: "text-red-400 bg-red-500/10 border-red-500/30",
  unverified: "text-zinc-400 bg-zinc-500/10 border-zinc-500/30"
};

const formatDate = (value?: string) => {
  if (!value) return "Not submitted";
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return value;
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(parsed));
};

const getDocumentCount = (kyc?: KycSubmission) => [kyc?.frontImage, kyc?.backImage, kyc?.proofOfAddressImage].filter(Boolean).length;

export const AdminKycTab: React.FC = () => {
  const { usersDirectory, allKycSubmissions, adminKycReview } = useApp();
  const [searchQuery, setSearchQuery] = useState("");
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<string | null>(null);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<"all" | KycStatus>("all");
  const [reviewingEmail, setReviewingEmail] = useState<string | null>(null);

  const rows = useMemo<KycRow[]>(() => usersDirectory.map(user => {
    const kyc = allKycSubmissions[user.email];
    return { ...user, kyc, kycStatus: kyc?.status || "unverified" };
  }), [usersDirectory, allKycSubmissions]);

  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return rows.filter(user => {
      const matchesStatus = filterStatus === "all" || user.kycStatus === filterStatus;
      if (!query) return matchesStatus;
      const searchable = [
        user.name,
        user.email,
        user.kyc?.documentType || user.kyc?.idType || "",
        user.kyc?.idNumber || "",
        user.kyc?.country || "",
        user.kyc?.adminNotes || user.kyc?.rejectionReason || ""
      ].join(" ").toLowerCase();
      return matchesStatus && searchable.includes(query);
    }).sort((a, b) => {
      if (a.kycStatus === "pending" && b.kycStatus !== "pending") return -1;
      if (b.kycStatus === "pending" && a.kycStatus !== "pending") return 1;
      return Date.parse(b.kyc?.submissionDate || "0") - Date.parse(a.kyc?.submissionDate || "0");
    });
  }, [rows, filterStatus, searchQuery]);

  const pendingCount = rows.filter(user => user.kycStatus === "pending").length;

  const showFeedback = (message: string) => {
    setFeedback(message);
    setTimeout(() => setFeedback(null), 3000);
  };

  const approve = async (user: KycRow) => {
    const note = adminNotes[user.email] || "Verified by admin.";
    setReviewingEmail(user.email);
    try {
      await adminKycReview(user.email, "approved", note);
      showFeedback(`KYC approved for ${user.email}`);
    } catch {
      showFeedback(`Unable to approve KYC for ${user.email}`);
    } finally {
      setReviewingEmail(null);
    }
  };

  const reject = async (user: KycRow) => {
    const reason = adminNotes[user.email] || "Documents not sufficient.";
    setReviewingEmail(user.email);
    try {
      await adminKycReview(user.email, "rejected", reason);
      showFeedback(`KYC rejected for ${user.email}`);
    } catch {
      showFeedback(`Unable to reject KYC for ${user.email}`);
    } finally {
      setReviewingEmail(null);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="space-y-6">
      <div className="bg-surface border border-line rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-ink flex items-center gap-2">
              <UserCheck size={20} className="text-accent" /> ID Verifications
            </h1>
            <p className="text-xs text-muted mt-1">Review identity documents, proof of address, notes, and verification outcomes.</p>
          </div>
          <span className="flex items-center gap-2 text-2xs font-bold text-yellow-400 bg-yellow-500/10 border border-yellow-500/30 px-3 py-1.5 rounded-full">
            {pendingCount} Pending Reviews
          </span>
        </div>
      </div>

      {feedback && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
          {feedback}
        </motion.div>
      )}

      <div className="bg-surface border border-line rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-line flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="relative lg:w-80">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
            <input type="text" placeholder="Search verifications" value={searchQuery} onChange={event => setSearchQuery(event.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-ground border border-line rounded-xl text-sm text-ink placeholder:text-muted focus:outline-none focus:border-accent" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {(["all", "pending", "approved", "rejected", "unverified"] as const).map(status => (
              <button key={status} onClick={() => setFilterStatus(status)}
                className={`px-3 py-2 text-2xs font-bold uppercase rounded-lg border transition-colors cursor-pointer ${filterStatus === status ? "bg-accent text-ground border-accent" : "bg-ground text-muted border-line hover:border-accent"}`}>
                {status}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] text-left">
            <thead className="bg-ground/60 border-b border-line">
              <tr className="text-2xs uppercase tracking-wider text-muted">
                <th className="px-5 py-3 font-bold">User</th>
                <th className="px-4 py-3 font-bold">Submission Date</th>
                <th className="px-4 py-3 font-bold">Document Type</th>
                <th className="px-4 py-3 font-bold">Documents</th>
                <th className="px-4 py-3 font-bold">Status</th>
                <th className="px-4 py-3 font-bold">Admin Notes</th>
                <th className="px-5 py-3 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/70">
              {filtered.map(user => {
                const kyc = user.kyc;
                const isExpanded = expandedUser === user.email;
                const isReviewing = reviewingEmail === user.email;
                return (
                  <React.Fragment key={user.email}>
                    <tr className="hover:bg-ground/40 transition-colors align-top">
                      <td className="px-5 py-4">
                        <p className="text-xs font-bold text-ink">{user.name}</p>
                        <p className="text-2xs text-muted">{user.email}</p>
                      </td>
                      <td className="px-4 py-4 text-xs text-muted">{formatDate(kyc?.submissionDate)}</td>
                      <td className="px-4 py-4 text-xs font-bold text-ink">{kyc?.documentType || kyc?.idType || "Not submitted"}</td>
                      <td className="px-4 py-4">
                        <button disabled={!kyc} onClick={() => setExpandedUser(isExpanded ? null : user.email)} className="inline-flex items-center gap-1.5 px-3 py-2 bg-ground border border-line rounded-lg text-2xs font-bold text-ink disabled:opacity-50 cursor-pointer hover:border-accent">
                          <Eye size={12} /> View ({getDocumentCount(kyc)})
                        </button>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-2xs font-bold ${statusColors[user.kycStatus]}`}>
                          {user.kycStatus.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <input
                          value={adminNotes[user.email] ?? kyc?.adminNotes ?? kyc?.rejectionReason ?? ""}
                          onChange={event => setAdminNotes(prev => ({ ...prev, [user.email]: event.target.value }))}
                          placeholder="Approval note or rejection reason"
                          className="w-[250px] px-3 py-2 bg-ground border border-line rounded-lg text-xs text-ink placeholder:text-muted focus:outline-none focus:border-accent"
                        />
                      </td>
                      <td className="px-5 py-4">
                        {kyc?.status === "pending" ? (
                          <div className="flex justify-end gap-2">
                            <button onClick={() => approve(user)} disabled={isReviewing} className="flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-500 text-white font-bold text-2xs uppercase rounded-lg hover:bg-emerald-600 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                              <Check size={12} /> Approve
                            </button>
                            <button onClick={() => reject(user)} disabled={isReviewing} className="flex items-center justify-center gap-1.5 px-3 py-2 bg-red-500 text-white font-bold text-2xs uppercase rounded-lg hover:bg-red-600 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                              <X size={12} /> Reject
                            </button>
                          </div>
                        ) : (
                          <p className="text-right text-2xs font-bold uppercase text-muted">No action</p>
                        )}
                      </td>
                    </tr>
                    {isExpanded && kyc && (
                      <tr className="bg-ground/50">
                        <td colSpan={7} className="px-5 py-5">
                          <DocumentPanel kyc={kyc} />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && <div className="py-14 text-center text-sm text-muted">No verification records match this view.</div>}
      </div>
    </motion.div>
  );
};

const DocumentPanel: React.FC<{ kyc: KycSubmission }> = ({ kyc }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-2xs">
      <Info label="Document Number" value={kyc.idNumber || "Not captured"} />
      <Info label="Date of Birth" value={kyc.dob || "Not captured"} />
      <Info label="Country" value={kyc.country || "Not captured"} />
      <Info label="Address" value={[kyc.address, kyc.city].filter(Boolean).join(", ") || "Not captured"} />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <DocumentLink title="Primary Document" url={kyc.frontImage} />
      <DocumentLink title="Back Document" url={kyc.backImage} />
      <DocumentLink title="Proof of Address" url={kyc.proofOfAddressImage} optional />
    </div>
  </div>
);

const Info: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="bg-surface border border-line rounded-lg p-3">
    <p className="text-2xs uppercase tracking-wider text-muted font-bold">{label}</p>
    <p className="mt-1 text-ink font-bold break-words">{value}</p>
  </div>
);

const DocumentLink: React.FC<{ title: string; url?: string; optional?: boolean }> = ({ title, url, optional }) => (
  <div className="bg-surface border border-line rounded-xl p-3 min-h-[120px]">
    <p className="text-2xs text-muted uppercase font-bold mb-2 flex items-center gap-1"><FileText size={11} /> {title}</p>
    {url ? (
      <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-bold text-accent hover:text-ink">
        Open uploaded document <ExternalLink size={12} />
      </a>
    ) : (
      <p className="text-xs text-muted">{optional ? "Not provided" : "Missing document"}</p>
    )}
  </div>
);