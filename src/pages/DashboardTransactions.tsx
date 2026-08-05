import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  History,
  WalletCards,
  XCircle,
} from "lucide-react";
import { useSession } from "../context/domains/SessionContext";
import { Badge, Button, EmptyState, SectionCard, Select } from "../components/ui";
import { formatDateTime, formatMoney } from "../lib/format";
import { TransactionReceipt } from "../components/TransactionReceipt";
import type { Transaction } from "../types";

export const DashboardTransactions: React.FC = () => {
  const { user } = useSession();

  // Receipt target — `filtered` derives from user.transactions, which is
  // already scoped to the signed-in user, so no new fetch path is introduced.
  const [receiptTx, setReceiptTx] = useState<Transaction | null>(null);
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "" | "completed" | "pending" | "failed" | "rejected" | "approved"
  >("");
  const [filterTime, setFilterTime] = useState<"" | "7" | "30" | "90">("");

  const filtered = useMemo(() => {
    let items = [...user.transactions];

    if (filterType) items = items.filter((t) => t.type === filterType);
    if (filterStatus) items = items.filter((t) => t.status === filterStatus);
    if (filterTime) {
      const days = parseInt(filterTime);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      items = items.filter((t) => new Date(t.date) >= cutoff);
    }

    return items;
  }, [user.transactions, filterType, filterStatus, filterTime]);

  const hasFilters = Boolean(filterType || filterStatus || filterTime);
  const clearFilters = () => {
    setFilterType("");
    setFilterStatus("");
    setFilterTime("");
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "completed":
      case "approved":
        return (
          <Badge tone="positive">
            <CheckCircle2 size={11} /> {status}
          </Badge>
        );
      case "pending":
        return (
          <Badge tone="warning">
            <Clock size={11} /> Pending
          </Badge>
        );
      case "failed":
        return (
          <Badge tone="negative">
            <XCircle size={11} /> Failed
          </Badge>
        );
      case "rejected":
        return (
          <Badge tone="negative">
            <AlertTriangle size={11} /> Rejected
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4 pb-4 sm:pb-6">
      <header className="border-b border-line pb-5">
        <div className="flex items-center gap-2.5">
          <History size={20} className="shrink-0 text-faint" aria-hidden="true" />
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Transactions</h1>
        </div>
        <p className="mt-1 text-xs text-muted">
          Every deposit, withdrawal, investment and payout on your account.
        </p>
      </header>

      {/* Filters sit in one row above the list. Native selects, so on a phone
          these are the OS picker rather than a custom dropdown. */}
      <div className="flex flex-wrap items-end gap-3">
        <Select
          label="Type"
          className="min-w-[9rem]"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="">All types</option>
          <option value="deposit">Deposits</option>
          <option value="withdrawal">Withdrawals</option>
          <option value="investment">Investments</option>
          <option value="payout">Payouts</option>
          <option value="adjustment">Adjustments</option>
        </Select>

        <Select
          label="Status"
          className="min-w-[9rem]"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
        >
          <option value="">All statuses</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </Select>

        <Select
          label="Period"
          className="min-w-[9rem]"
          value={filterTime}
          onChange={(e) => setFilterTime(e.target.value as typeof filterTime)}
        >
          <option value="">All time</option>
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </Select>

        {hasFilters && (
          <Button variant="ghost" onClick={clearFilters}>
            Clear filters
          </Button>
        )}
      </div>

      <SectionCard
        flush
        title="History"
        action={
          <span className="text-2xs tabular-nums text-faint">
            {filtered.length} of {user.transactions.length}
          </span>
        }
      >
        {filtered.length === 0 ? (
          user.transactions.length === 0 ? (
            <EmptyState
              icon={History}
              title="No transactions yet"
              description="Deposits, withdrawals and payouts will appear here."
            />
          ) : (
            <EmptyState
              icon={History}
              title="Nothing matches these filters"
              description="Try widening the type, status or period."
              action={
                <Button size="sm" variant="secondary" onClick={clearFilters}>
                  Clear filters
                </Button>
              }
            />
          )
        ) : (
          <ul className="divide-y divide-line">
            {filtered.map((tx) => {
              const isCredit = tx.type === "deposit" || tx.type === "payout";
              const isDebit = tx.type === "withdrawal" || tx.type === "investment";
              const Icon = isCredit ? ArrowDownLeft : isDebit ? ArrowUpRight : WalletCards;

              return (
                /* This list is hand-rolled rather than a DataTable, so the
                   row affordances DataTable gives its consumers for free —
                   role, tabIndex, Enter/Space activation, focus ring — have
                   to be spelled out here. Same contract as DataTable's
                   onRowClick rows, so the two behave identically. */
                <li
                  key={tx.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`View ${tx.type} receipt for ${formatMoney(tx.amount)}`}
                  onClick={() => setReceiptTx(tx)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setReceiptTx(tx);
                    }
                  }}
                  className="flex cursor-pointer items-center justify-between gap-4 px-4 py-3.5 transition-colors duration-[--duration-fast] hover:bg-raised focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={
                        "grid h-8 w-8 shrink-0 place-items-center rounded-full " +
                        (isCredit ? "bg-positive-soft text-positive" : "bg-raised text-muted")
                      }
                      aria-hidden="true"
                    >
                      <Icon size={14} />
                    </span>
                    <div className="min-w-0">
                      <span className="block text-sm font-medium capitalize text-ink">{tx.type}</span>
                      {/* Was `{tx.timestamp || tx.date}` printed verbatim — a
                          raw ISO string in the UI. */}
                      <span className="block truncate text-2xs text-muted">
                        {formatDateTime(tx.timestamp || tx.date)}
                        {(tx.currency || tx.asset) && ` · ${tx.currency || tx.asset}`}
                      </span>
                      <span className="block truncate font-data text-2xs text-faint">{tx.id}</span>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span
                      className={`font-data text-sm font-semibold tabular-nums ${
                        isCredit ? "text-positive" : "text-ink"
                      }`}
                    >
                      {isCredit ? "+" : isDebit ? "−" : ""}
                      {formatMoney(tx.amount)}
                    </span>
                    {statusBadge(tx.status)}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </SectionCard>

      <TransactionReceipt transaction={receiptTx} onClose={() => setReceiptTx(null)} />
    </div>
  );
};
