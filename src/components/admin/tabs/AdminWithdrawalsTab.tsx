import React, { useMemo, useState } from "react";
import { motion } from "motion/react";
import { AlertCircle, ArrowUpRight, Check, ClipboardList, Hash, Loader2, Search, X } from "lucide-react";
import { useApp } from "../../../context/AppContext";
import type { Transaction } from "../../../types";
import { formatDateTime } from "../../../lib/format";

type WithdrawalStatus = "pending" | "approved" | "rejected";

type WithdrawalRow = Transaction & {
  userName: string;
  userEmail: string;
  coin: string;
  network: string;
  destinationWallet: string;
  displayStatus: WithdrawalStatus;
};

const statusStyles: Record<WithdrawalStatus, string> = {
  pending: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
  approved: "text-positive bg-positive/10 border-positive/30",
  rejected: "text-negative bg-negative/10 border-negative/30"
};

const statusLabels: Record<WithdrawalStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected"
};

const normalizeStatus = (status: Transaction["status"]): WithdrawalStatus => {
  if (status === "pending") return "pending";
  if (status === "rejected" || status === "failed") return "rejected";
  return "approved";
};

const parseAsset = (asset: string) => {
  const normalized = asset.replace(/_/g, " ").trim();
  if (normalized.toLowerCase() === "paypal") return { coin: "PayPal", network: "Off-chain" };
  if (normalized.toLowerCase() === "bank") return { coin: "Bank", network: "Fiat" };

  const [coin = "USD", ...networkParts] = normalized.split(/\s+/);
  const network = networkParts.join(" ") || (coin.toUpperCase() === "USD" ? "Fiat" : "Native");
  return { coin, network };
};

const formatMoney = (amount: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(amount);

const shortValue = (value: string, left = 10, right = 6) =>
  value.length > left + right + 3 ? `${value.slice(0, left)}...${value.slice(-right)}` : value;

const getDestinationWallet = (transaction: Transaction) => {
  if (transaction.paypalEmail) return `PayPal: ${transaction.paypalEmail}`;
  if (transaction.bankDetails) {
    return `${transaction.bankDetails.bankName} / ${transaction.bankDetails.accountNumber} / ${transaction.bankDetails.accountName}`;
  }
  return transaction.address || "Not captured";
};

const buildWithdrawalRows = (
  transactions: Transaction[],
  directory: Map<string, { email: string; name: string | null }>,
): WithdrawalRow[] =>
  transactions
    .filter(transaction => transaction.type === "withdrawal")
    .map(transaction => {
      const asset = parseAsset(transaction.asset);
      // Older rows can have blank denormalized user_email/user_name — fall back
      // to the users directory by user_id so the requester is always shown.
      const profile = transaction.userId ? directory.get(transaction.userId) : undefined;
      return {
        ...transaction,
        userName: transaction.userName || profile?.name || "",
        userEmail: transaction.userEmail || profile?.email || "",
        coin: asset.coin,
        network: asset.network,
        destinationWallet: getDestinationWallet(transaction),
        displayStatus: normalizeStatus(transaction.status)
      };
    });

export const AdminWithdrawalsTab: React.FC = () => {
  const { adminTransactions, adminApproveWithdrawal, adminRejectWithdrawal, usersDirectory } = useApp();
  const directoryById = useMemo(
    () => new Map((usersDirectory ?? []).map(profile => [profile.id, { email: profile.email, name: profile.name }])),
    [usersDirectory],
  );
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<"all" | WithdrawalStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const isLoading = !Array.isArray(adminTransactions);

  const withdrawalResult = useMemo(() => {
    try {
      const rows = buildWithdrawalRows(adminTransactions, directoryById).sort((a, b) => {
        if (a.displayStatus === "pending" && b.displayStatus !== "pending") return -1;
        if (b.displayStatus === "pending" && a.displayStatus !== "pending") return 1;
        const dateA = Date.parse(a.date);
        const dateB = Date.parse(b.date);
        if (!Number.isNaN(dateA) && !Number.isNaN(dateB) && dateA !== dateB) return dateB - dateA;
        return b.id.localeCompare(a.id);
      });

      return { rows, error: null as string | null };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to prepare withdrawal records.";
      return { rows: [] as WithdrawalRow[], error: message };
    }
  }, [adminTransactions, directoryById]);

  const withdrawals = withdrawalResult.rows;

  const filteredWithdrawals = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return withdrawals.filter(withdrawal => {
      const matchesStatus = filterStatus === "all" || withdrawal.displayStatus === filterStatus;
      if (!query) return matchesStatus;

      const searchable = [
        withdrawal.id,
        withdrawal.userName,
        withdrawal.userEmail,
        withdrawal.coin,
        withdrawal.network,
        withdrawal.destinationWallet,
        withdrawal.amount.toString()
      ].join(" ").toLowerCase();

      return matchesStatus && searchable.includes(query);
    });
  }, [withdrawals, filterStatus, searchQuery]);

  const stats = useMemo(() => ({
    total: withdrawals.length,
    pending: withdrawals.filter(withdrawal => withdrawal.displayStatus === "pending").length,
    approved: withdrawals.filter(withdrawal => withdrawal.displayStatus === "approved").length,
    rejected: withdrawals.filter(withdrawal => withdrawal.displayStatus === "rejected").length
  }), [withdrawals]);

  const setNote = (withdrawalId: string, value: string) => {
    setAdminNotes(prev => ({ ...prev, [withdrawalId]: value }));
  };

  const showFeedback = (message: string) => {
    setFeedback(message);
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleApprove = (withdrawal: WithdrawalRow) => {
    const confirmed = window.confirm(`Approve withdrawal ${withdrawal.id} for ${withdrawal.userEmail}?`);
    if (!confirmed) return;

    adminApproveWithdrawal(withdrawal.id, adminNotes[withdrawal.id] || undefined);
    showFeedback(`Approved withdrawal ${withdrawal.id}`);
  };

  const handleReject = (withdrawal: WithdrawalRow) => {
    const confirmed = window.confirm(`Reject withdrawal ${withdrawal.id} for ${withdrawal.userEmail}?`);
    if (!confirmed) return;

    adminRejectWithdrawal(withdrawal.id, adminNotes[withdrawal.id] || undefined);
    showFeedback(`Rejected withdrawal ${withdrawal.id}`);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="space-y-6">
      <div className="bg-surface border border-line rounded-2xl p-6 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-5">
        <div>
          <h1 className="text-xl font-bold text-ink flex items-center gap-2">
            <ArrowUpRight size={20} className="text-accent" /> Withdrawal Management
          </h1>
          <p className="text-xs text-muted mt-1">Review payout destinations, approve verified withdrawals, or reject unsafe requests.</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
          <StatBadge label="Total" value={stats.total} />
          <StatBadge label="Pending" value={stats.pending} tone="yellow" />
          <StatBadge label="Approved" value={stats.approved} tone="green" />
          <StatBadge label="Rejected" value={stats.rejected} tone="red" />
        </div>
      </div>

      {feedback && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 rounded-xl bg-positive/10 border border-positive/30 text-positive text-xs font-bold flex items-center gap-2">
          <Check size={14} /> {feedback}
        </motion.div>
      )}

      <div className="bg-surface border border-line rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-line flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-ink flex items-center gap-2">
              <ClipboardList size={16} className="text-accent" /> Withdrawal Queue
            </h2>
            <p className="text-2xs text-muted mt-1">Pending withdrawals stay at the top for faster treasury review.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
            <div className="relative sm:w-72">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                value={searchQuery}
                onChange={event => setSearchQuery(event.target.value)}
                placeholder="Search withdrawals"
                className="w-full pl-9 pr-3 py-2 bg-ground border border-line rounded-lg text-xs text-ink placeholder:text-muted focus:outline-none focus:border-accent"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {(["all", "pending", "approved", "rejected"] as const).map(status => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-3 py-2 text-2xs font-bold uppercase rounded-lg border transition-colors cursor-pointer ${filterStatus === status ? "bg-accent text-ground border-accent" : "bg-ground text-muted border-line hover:border-accent"}`}
                >
                  {status === "all" ? "All" : statusLabels[status]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {isLoading && (
          <StateMessage icon={<Loader2 size={18} className="animate-spin" />} title="Loading withdrawals" message="Preparing withdrawal requests for review." />
        )}

        {!isLoading && withdrawalResult.error && (
          <StateMessage icon={<AlertCircle size={18} />} title="Unable to load withdrawals" message={withdrawalResult.error} tone="error" />
        )}

        {!isLoading && !withdrawalResult.error && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1260px] text-left">
                <thead className="bg-ground/60 border-b border-line">
                  <tr className="text-2xs uppercase tracking-wider text-muted">
                    <th className="px-5 py-3 font-bold">Withdrawal ID</th>
                    <th className="px-4 py-3 font-bold">User</th>
                    <th className="px-4 py-3 font-bold">Email</th>
                    <th className="px-4 py-3 font-bold">Coin</th>
                    <th className="px-4 py-3 font-bold">Network</th>
                    <th className="px-4 py-3 font-bold">Destination Wallet</th>
                    <th className="px-4 py-3 font-bold">Amount</th>
                    <th className="px-4 py-3 font-bold">Date</th>
                    <th className="px-4 py-3 font-bold">Status</th>
                    <th className="px-5 py-3 font-bold">Admin Notes</th>
                    <th className="px-5 py-3 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/70">
                  {filteredWithdrawals.map(withdrawal => (
                    <tr key={withdrawal.id} className="hover:bg-ground/40 transition-colors align-top">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 text-xs font-bold text-ink">
                          <Hash size={12} className="text-muted" />
                          <span title={withdrawal.id}>{shortValue(withdrawal.id, 12, 5)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-xs font-bold text-ink">{withdrawal.userName}</td>
                      <td className="px-4 py-4 text-xs text-muted">{withdrawal.userEmail}</td>
                      <td className="px-4 py-4 text-xs font-bold text-ink">{withdrawal.coin}</td>
                      <td className="px-4 py-4 text-xs text-accent font-bold">{withdrawal.network}</td>
                      <td className="px-4 py-4">
                        <span title={withdrawal.destinationWallet} className="block max-w-[220px] truncate text-xs text-ink">{withdrawal.destinationWallet}</span>
                        {withdrawal.destinationTag && <span className="mt-1 block text-2xs text-muted">Tag: {withdrawal.destinationTag}</span>}
                      </td>
                      <td className="px-4 py-4 text-xs font-bold text-ink">{formatMoney(withdrawal.amount)}</td>
                      <td className="px-4 py-4 text-xs text-muted">{formatDateTime(withdrawal.date)}</td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-2xs font-bold ${statusStyles[withdrawal.displayStatus]}`}>
                          {statusLabels[withdrawal.displayStatus]}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {withdrawal.displayStatus === "pending" ? (
                          <textarea
                            rows={2}
                            placeholder="Optional admin notes"
                            value={adminNotes[withdrawal.id] || ""}
                            onChange={event => setNote(withdrawal.id, event.target.value)}
                            className="w-[220px] px-3 py-2 bg-ground border border-line rounded-lg text-xs text-ink placeholder:text-muted focus:outline-none focus:border-accent resize-none"
                          />
                        ) : (
                          <p className="max-w-[220px] text-2xs text-muted">{withdrawal.notes || "No admin notes"}</p>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {withdrawal.displayStatus === "pending" ? (
                          <div className="flex justify-end gap-2">
                            <button onClick={() => handleApprove(withdrawal)} className="flex items-center justify-center gap-1.5 px-3 py-2 bg-positive text-ink font-bold text-2xs uppercase rounded-lg hover:bg-positive cursor-pointer">
                              <Check size={12} /> Approve
                            </button>
                            <button onClick={() => handleReject(withdrawal)} className="flex items-center justify-center gap-1.5 px-3 py-2 bg-negative text-ink font-bold text-2xs uppercase rounded-lg hover:bg-negative cursor-pointer">
                              <X size={12} /> Reject
                            </button>
                          </div>
                        ) : (
                          <p className="text-right text-2xs font-bold uppercase text-muted">Reviewed</p>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredWithdrawals.length === 0 && (
              <StateMessage title="No withdrawal records" message="No withdrawal requests match this view." />
            )}
          </>
        )}
      </div>
    </motion.div>
  );
};

const StatBadge: React.FC<{ label: string; value: number; tone?: "default" | "yellow" | "green" | "red" }> = ({ label, value, tone = "default" }) => {
  const toneClass = tone === "yellow"
    ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-400"
    : tone === "green"
      ? "bg-positive/10 border-positive/20 text-positive"
      : tone === "red"
        ? "bg-negative/10 border-negative/20 text-negative"
        : "bg-ground border-line text-ink";

  return (
    <div className={`px-3 py-2 border rounded-lg min-w-[78px] ${toneClass}`}>
      <p className="text-2xs uppercase text-muted tracking-wider">{label}</p>
      <p className="text-sm font-bold">{value}</p>
    </div>
  );
};

const StateMessage: React.FC<{ icon?: React.ReactNode; title: string; message: string; tone?: "default" | "error" }> = ({ icon, title, message, tone = "default" }) => {
  const toneClass = tone === "error" ? "text-negative" : "text-muted";

  return (
    <div className={`py-14 px-6 text-center ${toneClass}`}>
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-ground border border-line">
        {icon || <ClipboardList size={18} />}
      </div>
      <p className="text-sm font-bold text-ink">{title}</p>
      <p className="mt-1 text-xs text-muted">{message}</p>
    </div>
  );
};