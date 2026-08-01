import React, { useState, useMemo } from "react";
import { History, ChevronDown, CheckCircle2, Clock, XCircle, AlertTriangle, ArrowDownLeft, ArrowUpRight, WalletCards } from "lucide-react";
import { useApp } from "../context/AppContext";

export const DashboardTransactions: React.FC = () => {
  const { user } = useApp();

  const [filterType, setFilterType] = useState(""); 
  const [filterStatus, setFilterStatus] = useState<"" | "completed" | "pending" | "failed" | "rejected" | "approved">(""); 
  const [filterTime, setFilterTime] = useState<"" | "7" | "30" | "90">(""); 

  const filtered = useMemo(() => {
    let items = [...user.transactions];

    if (filterType) {
      items = items.filter(t => t.type === filterType);
    }
    if (filterStatus) {
      items = items.filter(t => t.status === filterStatus);
    }
    if (filterTime) {
      const days = parseInt(filterTime);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      items = items.filter(t => new Date(t.date) >= cutoff);
    }

    return items;
  }, [user.transactions, filterType, filterStatus, filterTime]);

  const statusBadge = (status: string) => {
    switch (status) {
      case "completed":
      case "approved":
        return (
          <span className="flex items-center gap-1 text-2xs font-bold text-positive">
            <CheckCircle2 size={12} /> Completed
          </span>
        );
      case "pending":
        return (
          <span className="flex items-center gap-1 text-2xs font-bold text-warning">
            <Clock size={12} /> Pending
          </span>
        );
      case "failed":
        return (
          <span className="flex items-center gap-1 text-2xs font-bold text-negative">
            <XCircle size={12} /> Failed
          </span>
        );
      case "rejected":
        return (
          <span className="flex items-center gap-1 text-2xs font-bold text-negative">
            <AlertTriangle size={12} /> Rejected
          </span>
        );
      default:
        return <span className="text-2xs text-muted">{status}</span>;
    }
  };

  return (
    <div className="space-y-4 pb-4 sm:pb-6 font-sans overflow-x-hidden">
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-bold font-heading text-ink flex items-center gap-2">
          <History className="text-accent" size={24} />
          Transaction History
        </h2>
        
        {/* Filter Pills — Now functional */}
        <div className="flex flex-row overflow-x-auto whitespace-nowrap gap-2 justify-start w-full pb-1">
          <div className="relative">
            <select 
              value={filterType}
              onChange={e => setFilterType(e.target.value as any)}
              className="appearance-none bg-surface border border-line text-2xs py-1.5 px-3 pr-7 rounded-full hover:border-accent/50 transition-colors text-ink cursor-pointer outline-none focus:border-accent"
            >
              <option value="">All Types</option>
              <option value="deposit">Deposits</option>
              <option value="withdrawal">Withdrawals</option>
              <option value="investment">Investments</option>
              <option value="payout">Payouts</option>
              <option value="adjustment">Adjustments</option>
            </select>
            <ChevronDown size={10} className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted pointer-events-none" />
          </div>
          <div className="relative">
            <select 
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value as any)}
              className="appearance-none bg-surface border border-line text-2xs py-1.5 px-3 pr-7 rounded-full hover:border-accent/50 transition-colors text-ink cursor-pointer outline-none focus:border-accent"
            >
              <option value="">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <ChevronDown size={10} className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted pointer-events-none" />
          </div>
          <div className="relative">
            <select 
              value={filterTime}
              onChange={e => setFilterTime(e.target.value as any)}
              className="appearance-none bg-surface border border-line text-2xs py-1.5 px-3 pr-7 rounded-full hover:border-accent/50 transition-colors text-ink cursor-pointer outline-none focus:border-accent"
            >
              <option value="">All Time</option>
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last 90 Days</option>
            </select>
            <ChevronDown size={10} className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted pointer-events-none" />
          </div>

          {(filterType || filterStatus || filterTime) && (
            <button
              onClick={() => { setFilterType(""); setFilterStatus(""); setFilterTime(""); }}
              className="text-2xs text-accent hover:text-ink px-3 py-1.5 rounded-full border border-accent/30 bg-accent/5 font-bold cursor-pointer transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      <div className="bg-surface border border-line rounded-xl">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-muted text-sm">
            {user.transactions.length === 0 
              ? "No transactions yet. Deposit funds to get started." 
              : "No transactions match your filters."}
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-line/30">
            {filtered.map((tx) => {
              const isCredit = tx.type === "deposit" || tx.type === "payout";
              const isDebit = tx.type === "withdrawal" || tx.type === "investment";
              const amountPrefix = isCredit ? "+" : isDebit ? "-" : "";
              const amountDisplay = `${amountPrefix}$${tx.amount.toLocaleString()}`;
              const Icon = isCredit ? ArrowDownLeft : isDebit ? ArrowUpRight : WalletCards;

              return (
                <div key={tx.id} className="flex justify-between items-center py-4 px-4 hover:bg-panel/40 transition-colors gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isCredit ? "bg-positive/10 text-positive" : "bg-accent/10 text-accent"}`}>
                      <Icon size={14} />
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-sm font-medium text-ink capitalize">{tx.type}</span>
                      <span className="text-2xs text-muted font-mono truncate">{tx.timestamp || tx.date} - {tx.currency || tx.asset}</span>
                      <span className="text-2xs text-muted font-mono truncate">ID: {tx.id}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-0.5 shrink-0">
                    <span className={`text-sm font-bold font-data ${isCredit ? "text-positive" : "text-ink"}`}>
                      {amountDisplay}
                    </span>
                    {statusBadge(tx.status)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
