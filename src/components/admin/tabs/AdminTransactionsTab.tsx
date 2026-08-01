import React, { useMemo, useState } from "react";
import { CheckCircle2, Clock, Hash, ReceiptText, Search, XCircle } from "lucide-react";
import { useApp } from "../../../context/AppContext";
import type { Transaction } from "../../../types";
import { formatDateTime } from "../../../lib/format";
import {
  Badge,
  Column,
  DataTable,
  Input,
  SectionCard,
  Select,
} from "../../ui";
import { AdminTabHeader, AdminTabShell } from "../AdminTabShell";

type LedgerRow = Transaction & {
  userEmail: string;
  userName: string;
};

/** Ledger rows can carry a non-USD currency, so this keeps the explicit code. */
const formatLedgerMoney = (amount: number, currency = "USD") => {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
};

const shortValue = (value?: string, left = 12, right = 6) => {
  if (!value) return "Not linked";
  return value.length > left + right + 3 ? `${value.slice(0, left)}…${value.slice(-right)}` : value;
};

const statusTone = (status: Transaction["status"]) => {
  if (status === "completed" || status === "approved") return "positive" as const;
  if (status === "pending") return "warning" as const;
  return "negative" as const;
};

const StatusIcon: React.FC<{ status: Transaction["status"] }> = ({ status }) => {
  if (status === "completed" || status === "approved") return <CheckCircle2 size={11} />;
  if (status === "pending") return <Clock size={11} />;
  return <XCircle size={11} />;
};

const buildRows = (transactions: Transaction[]): LedgerRow[] =>
  transactions.map((transaction) => ({
    ...transaction,
    userEmail: transaction.userEmail || "",
    userName: transaction.userName || "",
  }));

export const AdminTransactionsTab: React.FC = () => {
  const { adminTransactions } = useApp();
  const [statusFilter, setStatusFilter] = useState<"all" | Transaction["status"]>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const transactions = useMemo(
    () =>
      buildRows(adminTransactions).sort((a, b) => {
        const dateA = Date.parse(a.timestamp || a.date);
        const dateB = Date.parse(b.timestamp || b.date);
        if (Number.isFinite(dateA) && Number.isFinite(dateB) && dateA !== dateB) return dateB - dateA;
        return b.id.localeCompare(a.id);
      }),
    [adminTransactions]
  );

  const statuses = useMemo(
    () => Array.from(new Set(transactions.map((item) => item.status))),
    [transactions]
  );

  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return transactions.filter((transaction) => {
      const matchesStatus = statusFilter === "all" || transaction.status === statusFilter;
      if (!query) return matchesStatus;

      const searchable = [
        transaction.id,
        transaction.userId || "",
        transaction.userName,
        transaction.userEmail,
        transaction.type,
        transaction.amount.toString(),
        transaction.currency || transaction.asset,
        transaction.status,
        transaction.relatedReferenceId || "",
        transaction.timestamp || transaction.date,
        transaction.notes || "",
      ]
        .join(" ")
        .toLowerCase();

      return matchesStatus && searchable.includes(query);
    });
  }, [transactions, statusFilter, searchQuery]);

  const totals = useMemo(
    () => ({
      all: transactions.length,
      pending: transactions.filter((i) => i.status === "pending").length,
      completed: transactions.filter((i) => i.status === "completed" || i.status === "approved")
        .length,
      failed: transactions.filter((i) => i.status === "failed" || i.status === "rejected").length,
    }),
    [transactions]
  );

  /* Nine columns forced min-w-[1320px] and a horizontal scroller. User ID and
     User Name were separate columns, as were Amount and Currency — pairs that
     belong in one cell. Consolidating gets the ledger to seven columns that
     fit without scrolling. */
  const columns: Column<LedgerRow>[] = [
    {
      key: "id",
      header: "Transaction ID",
      primary: true,
      cell: (t) => (
        <span className="font-data text-xs text-ink" title={t.id}>
          {shortValue(t.id)}
        </span>
      ),
    },
    {
      key: "user",
      header: "User",
      cell: (t) => (
        <div className="min-w-0">
          <span className="block truncate font-medium text-ink">{t.userName || "—"}</span>
          <span
            className="block truncate font-data text-2xs text-muted"
            title={t.userId || t.userEmail}
          >
            {shortValue(t.userId || t.userEmail, 14, 7)}
          </span>
        </div>
      ),
    },
    {
      key: "type",
      header: "Type",
      cell: (t) => <span className="capitalize text-ink">{t.type.replace(/_/g, " ")}</span>,
    },
    {
      key: "amount",
      header: "Amount",
      numeric: true,
      cell: (t) => (
        <div>
          <span className="block text-ink">
            {formatLedgerMoney(t.amount, t.currency || "USD")}
          </span>
          <span className="block text-2xs text-muted">{t.currency || t.asset}</span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (t) => (
        <Badge tone={statusTone(t.status)}>
          <StatusIcon status={t.status} /> {t.status}
        </Badge>
      ),
    },
    {
      key: "reference",
      header: "Reference",
      hideOnMobile: true,
      cell: (t) => (
        <span
          className="font-data text-2xs text-muted"
          title={t.relatedReferenceId || "Not linked"}
        >
          {shortValue(t.relatedReferenceId)}
        </span>
      ),
    },
    {
      key: "timestamp",
      header: "Timestamp",
      cell: (t) => (
        <span className="whitespace-nowrap text-muted">
          {formatDateTime(t.timestamp || t.date)}
        </span>
      ),
    },
  ];

  return (
    <AdminTabShell>
      <AdminTabHeader
        icon={ReceiptText}
        title="Financial ledger"
        description="Every transaction generated by user actions, payouts and admin adjustments."
        stats={[
          { label: "Total", value: totals.all },
          { label: "Pending", value: totals.pending, tone: "warning" },
          { label: "Settled", value: totals.completed, tone: "positive" },
          { label: "Blocked", value: totals.failed, tone: "negative" },
        ]}
      />

      <SectionCard
        flush
        icon={Hash}
        title="Ledger entries"
        action={
          <span className="text-2xs tabular-nums text-faint">
            {filtered.length} of {transactions.length}
          </span>
        }
      >
        <div className="flex flex-col gap-3 border-b border-line px-5 py-4 lg:flex-row lg:items-end lg:justify-between">
          <Input
            className="lg:w-72"
            aria-label="Search ledger"
            placeholder="Search by ID, user, reference…"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            prefix={<Search size={14} />}
          />
          <Select
            label="Status"
            className="lg:w-44"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as "all" | Transaction["status"])
            }
          >
            <option value="all">All statuses</option>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </Select>
        </div>

        <div className="p-3 sm:p-0">
          <DataTable
            caption="Full transaction ledger"
            columns={columns}
            rows={filtered}
            rowKey={(t) => `${t.userEmail}-${t.id}`}
            className="sm:[&>div]:rounded-none sm:[&>div]:border-0"
            empty={{
              icon: ReceiptText,
              title: "No ledger entries match this view",
              description: "Try clearing the search or status filter.",
            }}
          />
        </div>
      </SectionCard>
    </AdminTabShell>
  );
};
