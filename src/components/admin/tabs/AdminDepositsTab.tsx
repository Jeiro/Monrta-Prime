import React, { useMemo, useState } from "react";
import { motion } from "motion/react";
import { ArrowDownLeft, Check, ClipboardList, FileText, Hash, Search, X } from "lucide-react";
import { useApp } from "../../../context/AppContext";
import { getDepositWalletLabel } from "../../../services";
import type { DepositWallet, Transaction } from "../../../types";

type DepositStatus = "pending" | "approved" | "rejected";

type DepositRow = Transaction & {
  userName: string;
  userEmail: string;
  coin: string;
  network: string;
  wallet: string;
  displayStatus: DepositStatus;
};

const statusStyles: Record<DepositStatus, string> = {
  pending: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
  approved: "text-positive bg-positive/10 border-positive/30",
  rejected: "text-negative bg-negative/10 border-negative/30"
};

const statusLabels: Record<DepositStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected"
};

const normalizeStatus = (status: Transaction["status"]): DepositStatus => {
  if (status === "pending") return "pending";
  if (status === "rejected" || status === "failed") return "rejected";
  return "approved";
};

const parseAsset = (asset: string) => {
  const normalized = asset.replace(/_/g, " ").trim();
  const [coin = "USD", ...networkParts] = normalized.split(/\s+/);
  const network = networkParts.join(" ") || (coin.toUpperCase() === "USD" ? "Fiat" : "Native");
  return { coin, network };
};

const normalizeKey = (value: string) => value.trim().replace(/\s+/g, " ").toLowerCase();

const resolveDepositMeta = (
  transaction: Transaction,
  depositWallets: DepositWallet[],
  adminWallets: Record<string, string>
) => {
  const asset = transaction.asset || "USD";
  const assetKey = normalizeKey(asset);
  const assetUnderscoreKey = assetKey.replace(/\s+/g, "_");
  const matchedWallet = depositWallets.find(wallet => {
    const label = normalizeKey(getDepositWalletLabel(wallet));
    const compact = normalizeKey(`${wallet.coinName} ${wallet.network}`);
    const underscore = compact.replace(/\s+/g, "_");
    return label === assetKey || compact === assetKey || underscore === assetUnderscoreKey;
  });

  const parsed = parseAsset(asset);
  const walletAddress =
    transaction.address ||
    matchedWallet?.walletAddress ||
    adminWallets[asset] ||
    adminWallets[asset.replace(/\s+/g, "_").toUpperCase()] ||
    adminWallets[parsed.coin] ||
    "Not captured";

  return {
    coin: matchedWallet?.coinName || parsed.coin,
    network: matchedWallet?.network || parsed.network,
    wallet: walletAddress
  };
};

const formatMoney = (amount: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(amount);

const shortValue = (value: string, left = 10, right = 6) =>
  value.length > left + right + 3 ? `${value.slice(0, left)}...${value.slice(-right)}` : value;

const buildDepositRows = (
  transactions: Transaction[],
  depositWallets: DepositWallet[],
  adminWallets: Record<string, string>
): DepositRow[] =>
  transactions
    .filter(transaction => transaction.type === "deposit")
    .map(transaction => {
      const meta = resolveDepositMeta(transaction, depositWallets, adminWallets);
      return {
        ...transaction,
        userName: transaction.userName || "",
        userEmail: transaction.userEmail || "",
        coin: meta.coin,
        network: meta.network,
        wallet: meta.wallet,
        displayStatus: normalizeStatus(transaction.status)
      };
    });

export const AdminDepositsTab: React.FC = () => {
  const { adminTransactions, adminWallets, depositWallets, adminApproveDeposit, adminRejectDeposit } = useApp();
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<"all" | DepositStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const deposits = useMemo(() => {
    const rows = buildDepositRows(adminTransactions, depositWallets, adminWallets);
    return rows.sort((a, b) => {
      if (a.displayStatus === "pending" && b.displayStatus !== "pending") return -1;
      if (b.displayStatus === "pending" && a.displayStatus !== "pending") return 1;
      const dateA = Date.parse(a.date);
      const dateB = Date.parse(b.date);
      if (!Number.isNaN(dateA) && !Number.isNaN(dateB) && dateA !== dateB) return dateB - dateA;
      return b.id.localeCompare(a.id);
    });
  }, [adminTransactions, adminWallets, depositWallets]);

  const filteredDeposits = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return deposits.filter(deposit => {
      const matchesStatus = filterStatus === "all" || deposit.displayStatus === filterStatus;
      if (!query) return matchesStatus;

      const searchable = [
        deposit.id,
        deposit.userName,
        deposit.userEmail,
        deposit.coin,
        deposit.network,
        deposit.wallet,
        deposit.txHash || "",
        deposit.amount.toString()
      ].join(" ").toLowerCase();

      return matchesStatus && searchable.includes(query);
    });
  }, [deposits, filterStatus, searchQuery]);

  const stats = useMemo(() => ({
    total: deposits.length,
    pending: deposits.filter(deposit => deposit.displayStatus === "pending").length,
    approved: deposits.filter(deposit => deposit.displayStatus === "approved").length,
    rejected: deposits.filter(deposit => deposit.displayStatus === "rejected").length
  }), [deposits]);

  const setNote = (depositId: string, value: string) => {
    setAdminNotes(prev => ({ ...prev, [depositId]: value }));
  };

  const showFeedback = (message: string) => {
    setFeedback(message);
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleApprove = (deposit: DepositRow) => {
    adminApproveDeposit(deposit.id, adminNotes[deposit.id] || undefined);
    showFeedback(`Approved deposit ${deposit.id}`);
  };

  const handleReject = (deposit: DepositRow) => {
    adminRejectDeposit(deposit.id, adminNotes[deposit.id] || undefined);
    showFeedback(`Rejected deposit ${deposit.id}`);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="space-y-6">
      <div className="bg-surface border border-line rounded-2xl p-6 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-5">
        <div>
          <h1 className="text-xl font-bold text-ink flex items-center gap-2">
            <ArrowDownLeft size={20} className="text-positive" /> Crypto Deposit Management
          </h1>
          <p className="text-xs text-muted mt-1">Review incoming crypto deposits, wallet destinations, hashes, and admin decisions.</p>
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
              <ClipboardList size={16} className="text-accent" /> Deposit Queue
            </h2>
            <p className="text-2xs text-muted mt-1">Pending deposits stay at the top for faster treasury review.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
            <div className="relative sm:w-72">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                value={searchQuery}
                onChange={event => setSearchQuery(event.target.value)}
                placeholder="Search deposits"
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

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1280px] text-left">
            <thead className="bg-ground/60 border-b border-line">
              <tr className="text-2xs uppercase tracking-wider text-muted">
                <th className="px-5 py-3 font-bold">Deposit ID</th>
                <th className="px-4 py-3 font-bold">User</th>
                <th className="px-4 py-3 font-bold">Email</th>
                <th className="px-4 py-3 font-bold">Coin</th>
                <th className="px-4 py-3 font-bold">Network</th>
                <th className="px-4 py-3 font-bold">Wallet</th>
                <th className="px-4 py-3 font-bold">Amount</th>
                <th className="px-4 py-3 font-bold">Transaction Hash</th>
                <th className="px-4 py-3 font-bold">Date</th>
                <th className="px-4 py-3 font-bold">Status</th>
                <th className="px-5 py-3 font-bold">Admin Notes</th>
                <th className="px-5 py-3 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/70">
              {filteredDeposits.map(deposit => (
                <tr key={deposit.id} className="hover:bg-ground/40 transition-colors align-top">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-ink">
                      <Hash size={12} className="text-muted" />
                      <span title={deposit.id}>{shortValue(deposit.id, 12, 5)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-xs font-bold text-ink">{deposit.userName}</td>
                  <td className="px-4 py-4 text-xs text-muted">{deposit.userEmail}</td>
                  <td className="px-4 py-4 text-xs font-bold text-ink">{deposit.coin}</td>
                  <td className="px-4 py-4 text-xs text-accent font-bold">{deposit.network}</td>
                  <td className="px-4 py-4">
                    <span title={deposit.wallet} className="block max-w-[180px] truncate text-xs text-ink">{deposit.wallet}</span>
                  </td>
                  <td className="px-4 py-4 text-xs font-bold text-ink">{formatMoney(deposit.amount)}</td>
                  <td className="px-4 py-4">
                    <span title={deposit.txHash || "No hash submitted"} className="block max-w-[170px] truncate text-xs text-accent font-bold">
                      {deposit.txHash ? shortValue(deposit.txHash, 14, 7) : "No hash"}
                    </span>
                    {deposit.proofFile && (
                      <span className="mt-1 inline-flex items-center gap-1 text-2xs text-muted">
                        <FileText size={10} /> Proof attached
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-xs text-muted">{deposit.date}</td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-2xs font-bold ${statusStyles[deposit.displayStatus]}`}>
                      {statusLabels[deposit.displayStatus]}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {deposit.displayStatus === "pending" ? (
                      <textarea
                        rows={2}
                        placeholder="Optional admin notes"
                        value={adminNotes[deposit.id] || ""}
                        onChange={event => setNote(deposit.id, event.target.value)}
                        className="w-[220px] px-3 py-2 bg-ground border border-line rounded-lg text-xs text-ink placeholder:text-muted focus:outline-none focus:border-accent resize-none"
                      />
                    ) : (
                      <p className="max-w-[220px] text-2xs text-muted">{deposit.notes || "No admin notes"}</p>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    {deposit.displayStatus === "pending" ? (
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleApprove(deposit)} className="flex items-center justify-center gap-1.5 px-3 py-2 bg-positive text-ink font-bold text-2xs uppercase rounded-lg hover:bg-positive cursor-pointer">
                          <Check size={12} /> Approve
                        </button>
                        <button onClick={() => handleReject(deposit)} className="flex items-center justify-center gap-1.5 px-3 py-2 bg-negative text-ink font-bold text-2xs uppercase rounded-lg hover:bg-negative cursor-pointer">
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

        {filteredDeposits.length === 0 && (
          <div className="py-14 text-center text-sm text-muted">No deposit records match this view.</div>
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