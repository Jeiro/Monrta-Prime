import React, { useMemo, useState } from "react";
import { AlertCircle, ArrowUpRight, Check, ClipboardList, Search, X } from "lucide-react";
import { useApp } from "../../../context/AppContext";
import type { Transaction } from "../../../types";
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

type WithdrawalStatus = "pending" | "approved" | "rejected";

type WithdrawalRow = Transaction & {
  userName: string;
  userEmail: string;
  coin: string;
  network: string;
  destinationWallet: string;
  displayStatus: WithdrawalStatus;
};

const statusTone: Record<WithdrawalStatus, "warning" | "positive" | "negative"> = {
  pending: "warning",
  approved: "positive",
  rejected: "negative",
};

const statusLabels: Record<WithdrawalStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
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

const shortValue = (value: string, left = 10, right = 6) =>
  value.length > left + right + 3 ? `${value.slice(0, left)}…${value.slice(-right)}` : value;

const getDestinationWallet = (transaction: Transaction) => {
  if (transaction.paypalEmail) return `PayPal: ${transaction.paypalEmail}`;
  if (transaction.bankDetails) {
    return `${transaction.bankDetails.bankName} / ${transaction.bankDetails.accountNumber} / ${transaction.bankDetails.accountName}`;
  }
  return transaction.address || "Not captured";
};

const buildWithdrawalRows = (
  transactions: Transaction[],
  directory: Map<string, { email: string; name: string | null }>
): WithdrawalRow[] =>
  transactions
    .filter((transaction) => transaction.type === "withdrawal")
    .map((transaction) => {
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
        displayStatus: normalizeStatus(transaction.status),
      };
    });

export const AdminWithdrawalsTab: React.FC = () => {
  const { adminTransactions, adminApproveWithdrawal, adminRejectWithdrawal, usersDirectory } =
    useApp();
  const directoryById = useMemo(
    () =>
      new Map(
        (usersDirectory ?? []).map((profile) => [
          profile.id,
          { email: profile.email, name: profile.name },
        ])
      ),
    [usersDirectory]
  );
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<"all" | WithdrawalStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  /** Second step for an irreversible payout. Reset whenever the drawer moves. */
  const [confirming, setConfirming] = useState<"approve" | "reject" | null>(null);

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
      const message =
        error instanceof Error ? error.message : "Unable to prepare withdrawal records.";
      return { rows: [] as WithdrawalRow[], error: message };
    }
  }, [adminTransactions, directoryById]);

  const withdrawals = withdrawalResult.rows;

  const filteredWithdrawals = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return withdrawals.filter((withdrawal) => {
      const matchesStatus = filterStatus === "all" || withdrawal.displayStatus === filterStatus;
      if (!query) return matchesStatus;

      const searchable = [
        withdrawal.id,
        withdrawal.userName,
        withdrawal.userEmail,
        withdrawal.coin,
        withdrawal.network,
        withdrawal.destinationWallet,
        withdrawal.amount.toString(),
      ]
        .join(" ")
        .toLowerCase();

      return matchesStatus && searchable.includes(query);
    });
  }, [withdrawals, filterStatus, searchQuery]);

  const stats = useMemo(
    () => ({
      total: withdrawals.length,
      pending: withdrawals.filter((w) => w.displayStatus === "pending").length,
      approved: withdrawals.filter((w) => w.displayStatus === "approved").length,
      rejected: withdrawals.filter((w) => w.displayStatus === "rejected").length,
    }),
    [withdrawals]
  );

  const setNote = (withdrawalId: string, value: string) => {
    setAdminNotes((prev) => ({ ...prev, [withdrawalId]: value }));
  };

  const showFeedback = (message: string) => {
    setFeedback(message);
    setTimeout(() => setFeedback(null), 3500);
  };

  const closeDrawer = () => {
    setReviewingId(null);
    setConfirming(null);
  };

  const handleApprove = (withdrawal: WithdrawalRow) => {
    adminApproveWithdrawal(withdrawal.id, adminNotes[withdrawal.id] || undefined);
    showFeedback(`Approved withdrawal ${withdrawal.id}`);
    closeDrawer();
  };

  const handleReject = (withdrawal: WithdrawalRow) => {
    adminRejectWithdrawal(withdrawal.id, adminNotes[withdrawal.id] || undefined);
    showFeedback(`Rejected withdrawal ${withdrawal.id}`);
    closeDrawer();
  };

  const reviewing = withdrawals.find((w) => w.id === reviewingId) || null;

  const columns: Column<WithdrawalRow>[] = [
    {
      key: "id",
      header: "Withdrawal ID",
      primary: true,
      cell: (w) => (
        <span className="font-data text-xs text-ink" title={w.id}>
          {shortValue(w.id, 12, 5)}
        </span>
      ),
    },
    {
      key: "user",
      header: "User",
      cell: (w) => (
        <div className="min-w-0">
          <span className="block truncate font-medium text-ink">{w.userName || "—"}</span>
          <span className="block truncate text-2xs text-muted">{w.userEmail}</span>
        </div>
      ),
    },
    {
      key: "asset",
      header: "Asset",
      cell: (w) => (
        <div>
          <span className="block font-medium text-ink">{w.coin}</span>
          <span className="block text-2xs text-muted">{w.network}</span>
        </div>
      ),
    },
    {
      key: "destination",
      header: "Destination",
      hideOnMobile: true,
      cell: (w) => (
        <span
          title={w.destinationWallet}
          className="block max-w-[220px] truncate font-data text-2xs text-muted"
        >
          {w.destinationWallet}
        </span>
      ),
    },
    { key: "amount", header: "Amount", numeric: true, cell: (w) => formatMoney(w.amount) },
    {
      key: "date",
      header: "Date",
      cell: (w) => <span className="whitespace-nowrap text-muted">{formatDateTime(w.date)}</span>,
    },
    {
      key: "status",
      header: "Status",
      cell: (w) => <Badge tone={statusTone[w.displayStatus]}>{statusLabels[w.displayStatus]}</Badge>,
    },
    {
      key: "review",
      header: "",
      align: "right",
      cell: (w) => (
        <span className="whitespace-nowrap text-2xs font-semibold text-accent">
          {w.displayStatus === "pending" ? "Review →" : "View →"}
        </span>
      ),
    },
  ];

  return (
    <AdminTabShell>
      <AdminTabHeader
        icon={ArrowUpRight}
        title="Withdrawals"
        description="Review payout destinations before releasing funds."
        stats={[
          { label: "Total", value: stats.total },
          { label: "Pending", value: stats.pending, tone: "warning" },
          { label: "Approved", value: stats.approved, tone: "positive" },
          { label: "Rejected", value: stats.rejected, tone: "negative" },
        ]}
      />

      {feedback && <Alert tone="success">{feedback}</Alert>}
      {!isLoading && withdrawalResult.error && (
        <Alert tone="error" title="Unable to load withdrawals">
          {withdrawalResult.error}
        </Alert>
      )}

      <SectionCard
        flush
        icon={ClipboardList}
        title="Withdrawal queue"
        action={
          <span className="text-2xs tabular-nums text-faint">
            {filteredWithdrawals.length} of {withdrawals.length}
          </span>
        }
      >
        <div className="flex flex-col gap-3 border-b border-line px-5 py-4 lg:flex-row lg:items-end lg:justify-between">
          <Input
            className="lg:w-72"
            aria-label="Search withdrawals"
            placeholder="Search by ID, user, destination…"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            prefix={<Search size={14} />}
          />
          <Tabs<"all" | WithdrawalStatus>
            variant="pill"
            layoutGroup="withdrawal-status"
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
            caption="Withdrawal review queue"
            columns={columns}
            rows={filteredWithdrawals}
            rowKey={(w) => w.id}
            loading={isLoading}
            onRowClick={(w) => {
              setReviewingId(w.id);
              setConfirming(null);
            }}
            className="sm:[&>div]:rounded-none sm:[&>div]:border-0"
            empty={{
              icon: ClipboardList,
              title: "No withdrawals match this view",
              description:
                searchQuery || filterStatus !== "all"
                  ? "Try clearing the search or status filter."
                  : "Payout requests will appear here for review.",
            }}
          />
        </div>
      </SectionCard>

      <Drawer
        open={Boolean(reviewing)}
        onClose={closeDrawer}
        title={reviewing ? `Withdrawal ${shortValue(reviewing.id, 14, 6)}` : ""}
        footer={
          reviewing?.displayStatus === "pending" ? (
            /*
              Two-step, in-drawer.

              This used to be window.confirm(), which blocks the JS thread,
              can't be styled or themed, and on some browsers is suppressible
              — a poor gate for money leaving the platform. The confirmation
              is kept (it should be deliberate) but now lives in the UI, so it
              is themed, focus-trapped with the rest of the drawer, and names
              the amount and destination it is about to release.
            */
            confirming ? (
              <div className="space-y-2">
                <p className="text-xs text-muted">
                  {confirming === "approve" ? "Release" : "Reject"}{" "}
                  <span className="font-data font-semibold text-ink">
                    {formatMoney(reviewing.amount)}
                  </span>{" "}
                  to <span className="text-ink">{reviewing.userEmail}</span>?
                </p>
                <div className="flex gap-2">
                  <Button block variant="secondary" onClick={() => setConfirming(null)}>
                    Cancel
                  </Button>
                  <Button
                    block
                    variant={confirming === "approve" ? "positive" : "danger"}
                    onClick={() =>
                      confirming === "approve" ? handleApprove(reviewing) : handleReject(reviewing)
                    }
                  >
                    Confirm {confirming}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button block variant="positive" icon={Check} onClick={() => setConfirming("approve")}>
                  Approve
                </Button>
                <Button block variant="danger" icon={X} onClick={() => setConfirming("reject")}>
                  Reject
                </Button>
              </div>
            )
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
                { label: "Requested", value: formatDateTime(reviewing.date) },
              ].map((row) => (
                <div key={row.label} className="flex items-baseline justify-between gap-3">
                  <dt className="text-2xs font-semibold uppercase tracking-[0.09em] text-faint">
                    {row.label}
                  </dt>
                  <dd className="text-right text-sm text-ink">{row.value}</dd>
                </div>
              ))}
            </dl>

            {/* The destination is the one field that must be read in full —
                it was truncated to 220px in the old table. */}
            <div className="rounded-lg border border-line bg-panel p-3">
              <p className="text-2xs font-semibold uppercase tracking-[0.09em] text-faint">
                Destination
              </p>
              <p className="mt-1 break-all font-data text-xs text-ink">
                {reviewing.destinationWallet}
              </p>
              {reviewing.destinationTag && (
                <p className="mt-2 break-all font-data text-2xs text-warning">
                  Destination tag: {reviewing.destinationTag}
                </p>
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
