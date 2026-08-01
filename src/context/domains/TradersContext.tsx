import React, { createContext, useContext, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import type { TraderProfile } from "../../types";
import { syncCopyTradeCountdowns } from "../../services";
import { useTraders as useTradersData } from "../../hooks/data/useTraders";
import { useCopyTrades, type AdminCopyTrade } from "../../hooks/data/useCopyTrades";
import { useLiveClock } from "../../hooks/useLiveClock";
import { useSession } from "./SessionContext";
import { useAuditLogWriter } from "./AuditLogContext";
import { useNotifications } from "./NotificationsContext";
import { useWallet } from "./WalletContext";

interface TradersContextType {
  traders: TraderProfile[];
  adminCopyTrades: AdminCopyTrade[];
  copyTrader: (traderId: string, amount: number) => Promise<{ success: boolean; message: string }>;
  uncopyTrader: (traderId: string) => Promise<{ success: boolean; message: string }>;
  claimCopyTradePayout: (copyTradeId: string) => Promise<void>;
  adminUpdateTrader: (traderId: string, updatedData: Partial<TraderProfile>) => Promise<void>;
  adminCreateTrader: (trader: Omit<TraderProfile, "id">) => Promise<void>;
  adminDeleteTrader: (traderId: string) => Promise<void>;
}

const TradersContext = createContext<TradersContextType | undefined>(undefined);

/**
 * The trader catalog and copy trading. Sits below Wallet for the same reason
 * as investments: a failed affordability check opens the shared
 * insufficient-balance modal that Wallet owns.
 */
export const TradersProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    supabase,
    user,
    setUser,
    authReady,
    currentSupabaseUserId,
    currentUserIsAdmin,
    refetchCurrentUserProfile,
    tryReserveBalanceDebit,
    releaseBalanceDebit
  } = useSession();
  const { handleLog } = useAuditLogWriter();
  const { addNotification, dispatchTransactionalEmail } = useNotifications();
  const { setInsufficientBalanceOpen } = useWallet();
  const liveClock = useLiveClock();

  const { traders, adminCreateTrader, adminUpdateTrader, adminDeleteTrader } = useTradersData(
    supabase,
    authReady,
    currentUserIsAdmin,
    addNotification
  );
  const {
    copyTrades,
    adminCopyTrades,
    startCopyTrade,
    cancelCopyTrade,
    claimCopyTradePayout: claimCopyTradePayoutRpc
  } = useCopyTrades(supabase, authReady, currentSupabaseUserId, currentUserIsAdmin);

  // Copy trades: derive the time-varying fields (progress, remainingDays,
  // status) LIVE from start_timestamp/end_timestamp/now via
  // syncCopyTradeCountdowns — same frozen-stored-columns issue as investments
  // (bug #17). Money fields (amountInvested, roiPercent, expectedProfit,
  // totalReturn) are preserved as-is; this only re-derives display values.
  //
  // Depends on user.isLoggedIn as well as its hook data: the data hooks can
  // resolve BEFORE the profile loader sets isLoggedIn true, and without that
  // dependency the early fire hits the guard as a no-op and never re-runs.
  useEffect(() => {
    const derived = syncCopyTradeCountdowns(copyTrades, liveClock);
    setUser(prev => prev.isLoggedIn ? { ...prev, copyTrades: derived } : prev);
  }, [copyTrades, liveClock, user.isLoggedIn]);

  // Copy-trade maturity notifications — the mirror of the investment maturity
  // effect in InvestmentPlansContext (one effect in AppContext; safe to split
  // because the id sets are disjoint and the ref guard makes each idempotent).
  const notifiedMaturityIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Gate on currentSupabaseUserId (Clerk loaded → the Supabase client can
    // attach a token). The `user` object is hydrated from localStorage on first
    // mount, so without this guard the maturity notifications fire BEFORE the
    // Clerk session resolves and saveNotificationToDb runs unauthenticated →
    // 401 / RLS reject (bug #26). Once Clerk loads, this re-runs and persists.
    if (!user.isLoggedIn || !user.email || !currentSupabaseUserId) return;

    user.copyTrades
      .filter(trade => trade.status === "Completed" && trade.payoutCompleted)
      .forEach(trade => {
        if (notifiedMaturityIds.current.has(trade.id)) return;
        notifiedMaturityIds.current.add(trade.id);

        addNotification(`Copy trade with ${trade.traderName} completed and returns were credited.`, {
          title: "Copy trade completed",
          type: "success",
          eventKey: `copy:completed:${trade.id}`,
          action: { label: "View copy trading", view: "copy-trading" }
        });
        dispatchTransactionalEmail(user.email, "COPY_TRADE_COMPLETED", `copy:completed:${trade.id}`, {
          name: user.name,
          traderName: trade.traderName,
          payoutAmount: trade.totalReturn,
          profit: trade.expectedProfit,
          transactionId: trade.payoutTransactionId,
          status: "completed"
        });
      });
  }, [user.copyTrades, user.email, user.isLoggedIn, currentSupabaseUserId]);

  const copyTrader = async (traderId: string, amount: number): Promise<{ success: boolean; message: string }> => {
    if (!user.isLoggedIn || !user.email) {
      return { success: false, message: "AUTH_REQUIRED" };
    }

    const copyAmount = Number(amount);
    if (!Number.isFinite(copyAmount) || copyAmount <= 0) {
      return { success: false, message: "Please enter a valid amount." };
    }

    const t = traders.find(tr => tr.id === traderId);
    if (!t) return { success: false, message: "Trader not recognized on system node." };
    if ((t.active ?? true) === false) {
      return { success: false, message: "This trader is not accepting copy allocations right now." };
    }
    if (t.followers >= t.maxFollowers) {
      return { success: false, message: "Trader copying limit capped on active pools." };
    }

    const minCopyAmount = typeof t.minimumCopyAmount === "number" && Number.isFinite(t.minimumCopyAmount) ? t.minimumCopyAmount : 10;
    const maxCopyAmount = typeof t.maximumCopyAmount === "number" && Number.isFinite(t.maximumCopyAmount) ? t.maximumCopyAmount : Number.POSITIVE_INFINITY;

    if (copyAmount < minCopyAmount) {
      return { success: false, message: `Minimum copy amount for ${t.name} is $${minCopyAmount.toLocaleString()}.` };
    }
    if (copyAmount > maxCopyAmount) {
      return { success: false, message: `Maximum copy amount for ${t.name} is $${maxCopyAmount.toLocaleString()}.` };
    }
    if (user.balance < copyAmount) {
      setInsufficientBalanceOpen(true);
      return { success: false, message: "INSUFFICIENT_BALANCE" };
    }

    if (copyTrades.some(trade => trade.traderId === traderId && trade.status === "Running" && !trade.payoutCompleted)) {
      return { success: false, message: `You are already copying ${t.name}.` };
    }

    const actionKey = `copy:${traderId}:${copyAmount}`;
    const reservation = tryReserveBalanceDebit(actionKey, copyAmount);
    if (reservation === "duplicate") {
      return { success: false, message: "This copy trade request is already being processed." };
    }
    if (reservation === "insufficient") {
      setInsufficientBalanceOpen(true);
      return { success: false, message: "INSUFFICIENT_BALANCE" };
    }

    let newCopyTrade;
    try {
      newCopyTrade = await startCopyTrade(t, copyAmount);
      await refetchCurrentUserProfile();
      releaseBalanceDebit(actionKey, copyAmount);
    } catch (error) {
      releaseBalanceDebit(actionKey, copyAmount);
      console.error("Failed to start copy trade:", error);
      return { success: false, message: "Failed to start copy trade. Please try again." };
    }

    handleLog("Mirror Allocator Armed", `Allocated $${copyAmount} to copy ${t.name}.`, user.email, "success");
    addNotification(`Copy trade with ${t.name} started. Total return at maturity: $${newCopyTrade.totalReturn.toLocaleString()}.`, { title: "Copy trade started", type: "success", eventKey: `copy:started:${newCopyTrade.id}` });
    dispatchTransactionalEmail(user.email, "COPY_TRADE_STARTED", `copy:started:${newCopyTrade.id}`, { name: user.name, traderName: t.name, amount: copyAmount, allocation: copyAmount, totalReturn: newCopyTrade.totalReturn });
    return { success: true, message: "Copy Trading Activated. You are now copying this trader." };
  };

  const uncopyTrader = async (traderId: string): Promise<{ success: boolean; message: string }> => {
    if (!user.isLoggedIn || !user.email) {
       return { success: false, message: "Authentication required." };
    }

    const activeTrade = copyTrades.find(trade => trade.traderId === traderId && trade.status === "Running" && !trade.payoutCompleted);
    if (!activeTrade) {
      return { success: false, message: "No running copy trade found for this trader." };
    }

    const refundAmount = activeTrade.amountInvested;

    try {
      await cancelCopyTrade(activeTrade.id);
      await refetchCurrentUserProfile();
    } catch (error) {
      console.error("Failed to cancel copy trade:", error);
      return { success: false, message: "Failed to cancel copy trade. Please try again." };
    }

    addNotification(`Copy trading was cancelled and $${refundAmount} returned to your wallet balance.`, { title: "Copy trade cancelled", type: "warning", eventKey: `copy:cancelled:${activeTrade.id}` });
    dispatchTransactionalEmail(user.email, "COPY_TRADE_CANCELLED", `copy:cancelled:${activeTrade.id}`, { name: user.name, traderName: activeTrade.traderName, refundAmount, amount: refundAmount, transactionId: activeTrade.id, status: "cancelled" });

    return { success: true, message: "Copy Trading Deactivated. Your funds have been released." };
  };

  const claimCopyTradePayout = async (copyTradeId: string) => {
    const item = copyTrades.find(trade => trade.id === copyTradeId);
    if (!item) return;

    try {
      await claimCopyTradePayoutRpc(copyTradeId);
      await refetchCurrentUserProfile();
      handleLog("Copy Trade Payout Claimed", `Claimed payout for copy trade with ${item.traderName}.`, user.email || "system", "success");
      addNotification(`Your copy trade with ${item.traderName} matured — payout credited to your balance.`, { title: "Copy trade completed", type: "success", eventKey: `copy:payout:${copyTradeId}`, action: { label: "View copy trading", view: "copy-trading" } });
      toast.success("Payout claimed successfully");
    } catch (error) {
      console.error("Failed to claim copy trade payout:", error);
      toast.error("Failed to claim payout. Please try again.");
    }
  };

  return (
    <TradersContext.Provider value={{
      traders,
      adminCopyTrades,
      copyTrader,
      uncopyTrader,
      claimCopyTradePayout,
      adminUpdateTrader,
      adminCreateTrader,
      adminDeleteTrader
    }}>
      {children}
    </TradersContext.Provider>
  );
};

export const useTraders = () => {
  const context = useContext(TradersContext);
  if (context === undefined) {
    throw new Error("useTraders must be used inside a TradersProvider");
  }
  return context;
};
