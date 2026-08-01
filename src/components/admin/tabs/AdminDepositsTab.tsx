import React, { useMemo, useState } from "react";
import { ArrowDownLeft, Check, ClipboardList, FileText, Search, X } from "lucide-react";
import { useApp } from "../../../context/AppContext";
import { getDepositWalletLabel } from "../../../services";
import type { DepositWallet, Transaction } from "../../../types";
import { formatDateTime, formatMoney } from "../../../lib/format";
import {
  Alert,
  Badge,
  Button,
  Column,
  DataTable,
  Drawer,
  Input,
  SectionCard,
  Tabs,
  Textarea,
} from "../../ui";
import { AdminTabHeader, AdminTabShell } from "../AdminTabShell";

type DepositStatus = "pending" | "approved" | "rejected";

type DepositRow = Transaction & {
  userName: string;
  userEmail: string;
  coin: string;
  network: string;
  wallet: string;
  displayStatus: DepositStatus;
};

const statusTone: Record<DepositStatus, "warning" | "positive" | "negative"> = {
  pending: "warning",
  approved: "positive",
  rejected: "negative",
};

const statusLabels: Record<DepositStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
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
  const matchedWallet = depositWallets.find((wallet) => {
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
    wallet: walletAddress,
  };
};

/** Middle-truncation for IDs and hashes, which differ at both ends. */
const shortValue = (value: string, left = 10, right = 6) =>
  value.length > left + right + 3 ? `${value.slice(0, left)}…${value.slice(-right)}` : value;

const buildDepositRows = (
  transactions: Transaction[],
  depositWallets: DepositWallet[],
  adminWallets: Record<string, string>
): DepositRow[] =>
  transactions
    .filter((transaction) => transaction.type === "deposit")
    .map((transaction) => {
      const meta = resolveDepositMeta(transaction, depositWallets, adminWallets);
      return {
        ...transaction,
        userName: transaction.userName || "",
        userEmail: transaction.userEmail || "",
        coin: meta.coin,
        network: meta.network,
        wallet: meta.wallet,
        displayStatus: normalizeStatus(transaction.status),
      };
    });

export const AdminDepositsTab: React.FC = () => {
  const { adminTransactions, adminWallets, depositWallets, adminApproveDeposit, adminRejectDeposit } =
    useApp();
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<"all" | DepositStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [reviewingId, setReviewingId] = useState<string | null>(null);

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
    return deposits.filter((deposit) => {
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
        deposit.amount.toString(),
      ]
        .join(" ")
        .toLowerCase();

      return matchesStatus && searchable.includes(query);
    });
  }, [deposits, filterStatus, searchQuery]);

  const stats = useMemo(
    () => ({
      total: deposits.length,
      pending: deposits.filter((d) => d.displayStatus === "pending").length,
      approved: deposits.filter((d) => d.displayStatus === "approved").length,
      rejected: deposits.filter((d) => d.displayStatus === "rejected").length,
    }),
    [deposits]
  );

  const setNote = (depositId: string, value: string) => {
    setAdminNotes((prev) => ({ ...prev, [depositId]: value }));
  };

  const showFeedback = (message: string) => {
    setFeedback(message);
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleApprove = (deposit: DepositRow) => {
    adminApproveDeposit(deposit.id, adminNotes[deposit.id] || undefined);
    showFeedback(`Approved deposit ${deposit.id}`);
    setReviewingId(null);
  };

  const handleReject = (deposit: DepositRow) => {
    adminRejectDeposit(deposit.id, adminNotes[deposit.id] || undefined);
    showFeedback(`Rejected deposit ${deposit.id}`);
    setReviewingId(null);
  };

  const reviewing = deposits.find((d) => d.id === reviewingId) || null;

  const columns: Column<DepositRow>[] = [
    {
      key: "id",
      header: "Deposit ID",
      primary: true,
      cell: (d) => (
        <span className="font-data text-xs text-ink" title={d.id}>
          {shortValue(d.id, 12, 5)}
        </span>
      ),
    },
    {
      key: "user",
      header: "User",
      cell: (d) => (
        <div className="min-w-0">
          <span className="block truncate font-medium text-ink">{d.userName || "—"}</span>
          <span className="block truncate text-2xs text-muted">{d.userEmail}</span>
        </div>
      ),
    },
    {
      key: "asset",
      header: "Asset",
      cell: (d) => (
        <div>
          <span className="block font-medium text-ink">{d.coin}</span>
          <span className="block text-2xs text-muted">{d.network}</span>
        </div>
      ),
    },
    {
      key: "wallet",
      header: "Wallet",
      hideOnMobile: true,
      cell: (d) => (
        <span title={d.wallet} className="block max-w-[180px] truncate font-data text-2xs text-muted">
          {d.wallet}
        </span>
      ),
    },
    { key: "amount", header: "Amount", numeric: true, cell: (d) => formatMoney(d.amount) },
    {
      key: "hash",
      header: "Tx hash",
      hideOnMobile: true,
      cell: (d) => (
        <div>
          <span
            title={d.txHash || "No hash submitted"}
            className="block max-w-[170px] truncate font-data text-2xs text-muted"
          >
            {d.txHash ? shortValue(d.txHash, 14, 7) : "No hash"}
          </span>
          {d.proofFile && (
            <span className="mt-1 inline-flex items-center gap-1 text-2xs text-faint">
              <FileText size={10} /> Proof
            </span>
          )}
        </div>
      ),
    },
    {
      key: "date",
      header: "Date",
      cell: (d) => <span className="whitespace-nowrap text-muted">{formatDateTime(d.date)}</span>,
    },
    {
      key: "status",
      header: "Status",
      cell: (d) => <Badge tone={statusTone[d.displayStatus]}>{statusLabels[d.displayStatus]}</Badge>,
    },
    {
      key: "review",
      header: "",
      align: "right",
      cell: (d) => (
        <span className="whitespace-nowrap text-2xs font-semibold text-accent">
          {d.displayStatus === "pending" ? "Review →" : "View →"}
        </span>
      ),
    },
  ];

  return (
    <AdminTabShell>
      <AdminTabHeader
        icon={ArrowDownLeft}
        title="Deposits"
        description="Review incoming deposits, wallet destinations and transaction hashes."
        stats={[
          { label: "Total", value: stats.total },
          { label: "Pending", value: stats.pending, tone: "warning" },
          { label: "Approved", value: stats.approved, tone: "positive" },
          { label: "Rejected", value: stats.rejected, tone: "negative" },
        ]}
      />

      {feedback && <Alert tone="success">{feedback}</Alert>}

      <SectionCard
        flush
        icon={ClipboardList}
        title="Deposit queue"
        action={
          <span className="text-2xs tabular-nums text-faint">
            {filteredDeposits.length} of {deposits.length}
          </span>
        }
      >
        <div className="flex flex-col gap-3 border-b border-line px-5 py-4 lg:flex-row lg:items-end lg:justify-between">
          <Input
            className="lg:w-72"
            aria-label="Search deposits"
            placeholder="Search by ID, user, hash…"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            prefix={<Search size={14} />}
          />
          <Tabs<"all" | DepositStatus>
            variant="pill"
            layoutGroup="deposit-status"
            aria-label="Filter by status"
            value={filterStatus}
            onChange={setFilterStatus}
            items={[
              { id: "all", label: "All" },
              { id: "pending", label: "Pending", badge: stats.pending || undefined },
              { id: "approved", label: "Approved" },
              { id: "rejected", label: "Rejected" },
            ]}
          />
        </div>

        <div className="p-3 sm:p-0">
          <DataTable
            caption="Deposit review queue"
            columns={columns}
            rows={filteredDeposits}
            rowKey={(d) => d.id}
            onRowClick={(d) => setReviewingId(d.id)}
            className="sm:[&>div]:rounded-none sm:[&>div]:border-0"
            empty={{
              icon: ClipboardList,
              title: "No deposits match this view",
              description:
                searchQuery || filterStatus !== "all"
                  ? "Try clearing the search or status filter."
                  : "Incoming deposits will appear here for review.",
            }}
          />
        </div>
      </SectionCard>

      {/*
        Review happens in a drawer, not in the row.

        The queue previously carried a 200px <textarea> and two action
        buttons as table columns. With twelve columns that forced
        min-w-[1280px] and a horizontal scroller, so Approve/Reject sat off
        the right edge — the reject button was unreachable without scrolling
        a table most admins wouldn't realise scrolled. Moving them out drops
        the table to six readable columns and gives the wallet address, hash
        and proof room to be read in full rather than truncated to
        uselessness.

        It also puts a deliberate step in front of an irreversible money
        decision instead of a button crushed against a scroll edge.
      */}
      <Drawer
        open={Boolean(reviewing)}
        onClose={() => setReviewingId(null)}
        title={reviewing ? `Deposit ${shortValue(reviewing.id, 14, 6)}` : ""}
        footer={
          reviewing?.displayStatus === "pending" ? (
            <div className="flex gap-2">
              {/* Was bg-positive/bg-negative with text-ink — near-white on
                  green and red — and hover:bg-positive was identical to the
                  resting colour, so neither button had hover feedback. */}
              <Button
                block
                variant="positive"
                icon={Check}
                onClick={() => reviewing && handleApprove(reviewing)}
              >
                Approve
              </Button>
              <Button
                block
                variant="danger"
                icon={X}
                onClick={() => reviewing && handleReject(reviewing)}
              >
                Reject
              </Button>
            </div>
          ) : (
            <p className="text-center text-2xs uppercase tracking-[0.09em] text-faint">
              Already reviewed
            </p>
          )
        }
      >
        {reviewing && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <Badge tone={statusTone[reviewing.displayStatus]}>
                {statusLabels[reviewing.displayStatus]}
              </Badge>
              <span className="font-data text-lg font-semibold tabular-nums text-ink">
                {formatMoney(reviewing.amount)}
              </span>
            </div>

            <dl className="space-y-3">
              {[
                { label: "User", value: reviewing.userName || "—" },
                { label: "Email", value: reviewing.userEmail || "—" },
                { label: "Asset", value: `${reviewing.coin} · ${reviewing.network}` },
                { label: "Submitted", value: formatDateTime(reviewing.date) },
              ].map((row) => (
                <div key={row.label} className="flex items-baseline justify-between gap-3">
                  <dt className="text-2xs font-semibold uppercase tracking-[0.09em] text-faint">
                    {row.label}
                  </dt>
                  <dd className="text-right text-sm text-ink">{row.value}</dd>
                </div>
              ))}
            </dl>

            {/* Full values, not truncated: verifying a deposit means reading
                the whole address and hash. */}
            <div className="space-y-3">
              <div className="rounded-lg border border-line bg-panel p-3">
                <p className="text-2xs font-semibold uppercase tracking-[0.09em] text-faint">
                  Destination wallet
                </p>
                <p className="mt-1 break-all font-data text-xs text-ink">{reviewing.wallet}</p>
              </div>
              <div className="rounded-lg border border-line bg-panel p-3">
                <p className="text-2xs font-semibold uppercase tracking-[0.09em] text-faint">
                  Transaction hash
                </p>
                <p className="mt-1 break-all font-data text-xs text-ink">
                  {reviewing.txHash || "Not submitted"}
                </p>
              </div>
              {reviewing.proofFile && (
                <a
                  href={reviewing.proofFile}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 rounded-lg border border-line bg-panel p-3 text-xs text-accent transition-colors duration-[--duration-fast] hover:border-accent-line focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  <FileText size={14} /> View payment proof
                </a>
              )}
            </div>

            {reviewing.displayStatus === "pending" ? (
              <Textarea
                label="Admin notes"
                rows={3}
                placeholder="Optional — recorded against this decision"
                value={adminNotes[reviewing.id] || ""}
                onChange={(event) => setNote(reviewing.id, event.target.value)}
              />
            ) : (
              <div className="rounded-lg border border-line bg-panel p-3">
                <p className="text-2xs font-semibold uppercase tracking-[0.09em] text-faint">
                  Admin notes
                </p>
                <p className="mt-1 text-sm text-ink">{reviewing.notes || "No notes recorded"}</p>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </AdminTabShell>
  );
};
