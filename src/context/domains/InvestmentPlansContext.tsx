import React, { createContext, useContext, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import type { InvestmentPlan } from "../../types";
import { buildActiveInvestment, syncInvestmentCountdowns } from "../../services";
import { useInvestmentPlans as useInvestmentPlansData } from "../../hooks/data/useInvestmentPlans";
import { useActiveInvestments, type AdminActiveInvestment } from "../../hooks/data/useActiveInvestments";
import { useLiveClock } from "../../hooks/useLiveClock";
import { useSession } from "./SessionContext";
import { useAuditLogWriter } from "./AuditLogContext";
import { useNotifications } from "./NotificationsContext";
import { useWallet } from "./WalletContext";

interface InvestmentPlansContextType {
  plans: InvestmentPlan[];
  adminActiveInvestments: AdminActiveInvestment[];
  investInPlan: (planId: string, amount: number) => Promise<{ success: boolean; message: string }>;
  claimPlanPayout: (investmentId: string) => void;
  topUpInvestment: (investmentId: string, amount: number) => Promise<{ success: boolean; message: string }>;
  adminCreatePlan: (plan: Omit<InvestmentPlan, "id">) => Promise<void>;
  adminUpdatePlan: (plan: InvestmentPlan) => Promise<void>;
  adminDeletePlan: (planId: string) => Promise<void>;
  adminSetPlanStatus: (planId: string, status: "active" | "paused") => Promise<void>;
}

const InvestmentPlansContext = createContext<InvestmentPlansContextType | undefined>(undefined);

/**
 * Investment plans (the catalog) and the signed-in user's active investments.
 * Sits below Wallet because a failed affordability check opens the shared
 * insufficient-balance modal, which Wallet owns.
 */
export const InvestmentPlansProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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

  const {
    plans,
    createPlan: createInvestmentPlanInDb,
    savePlan: saveInvestmentPlanInDb,
    deletePlan: deleteInvestmentPlanInDb,
    setPlanEnabled: setInvestmentPlanEnabledInDb
  } = useInvestmentPlansData(supabase);
  const {
    activeInvestments,
    adminActiveInvestments,
    purchaseInvestment,
    claimInvestmentPayout,
    topUpInvestmentRpc
  } = useActiveInvestments(supabase, authReady, currentSupabaseUserId, currentUserIsAdmin);

  useEffect(() => {
    localStorage.setItem("orbitrio_plans_v3", JSON.stringify(plans));
  }, []);

  // Keep active investments in sync with their Supabase source — and derive the
  // time-varying fields (progress, accumulatedProfit, remainingDays, status)
  // LIVE from start_date/end_date/now via syncInvestmentCountdowns. The DB
  // stores those columns once at creation and never recomputes them (bug #17),
  // so without this they sit frozen at 0%/$0/full-duration. The stored money
  // fields (amount, roiPercent, expectedProfit, totalReturn) are the source of
  // truth and are preserved as-is — this only re-derives the display values.
  //
  // Like every `user` overlay effect, this depends on user.isLoggedIn as well
  // as its hook data: the data hooks (gated on authReady + userId) can resolve
  // BEFORE the profile loader sets isLoggedIn true, and without that dependency
  // the early fire hits the `prev.isLoggedIn ? … : prev` guard as a no-op and
  // never re-runs, leaving the dashboard empty.
  useEffect(() => {
    const derived = syncInvestmentCountdowns(activeInvestments, plans, liveClock);
    setUser(prev => prev.isLoggedIn ? { ...prev, activeInvestments: derived } : prev);
  }, [activeInvestments, plans, liveClock, user.isLoggedIn]);

  // Maturity notifications. Copy-trade maturity is the mirror of this in
  // TradersContext; the two were a single effect before the split, and doing so
  // is safe because the id sets are disjoint and the ref guard makes each
  // idempotent.
  const notifiedMaturityIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Gate on currentSupabaseUserId (Clerk loaded → the Supabase client can
    // attach a token). The `user` object is hydrated from localStorage on first
    // mount, so without this guard the maturity notifications fire BEFORE the
    // Clerk session resolves and saveNotificationToDb runs unauthenticated →
    // 401 / RLS reject (bug #26). Once Clerk loads, this re-runs and persists.
    if (!user.isLoggedIn || !user.email || !currentSupabaseUserId) return;

    user.activeInvestments
      .filter(investment => (investment.status === "Completed" || investment.status === "completed") && investment.payoutTransactionId)
      .forEach(investment => {
        if (notifiedMaturityIds.current.has(investment.id)) return;
        notifiedMaturityIds.current.add(investment.id);

        addNotification(`${investment.name} completed and funds were credited to your wallet.`, {
          title: "Investment completed",
          type: "success",
          eventKey: `investment:completed:${investment.id}`,
          action: { label: "View portfolio", view: "dashboard-portfolio" }
        });
        dispatchTransactionalEmail(user.email, "INVESTMENT_COMPLETED", `investment:completed:${investment.id}`, {
          name: user.name,
          investmentName: investment.name,
          payoutAmount: investment.totalReturn || investment.amount + investment.accumulatedProfit,
          profit: investment.expectedProfit ?? investment.accumulatedProfit,
          transactionId: investment.payoutTransactionId,
          status: "completed"
        });
      });
  }, [user.activeInvestments, user.email, user.isLoggedIn, currentSupabaseUserId]);

  const investInPlan = async (planId: string, amount: number): Promise<{ success: boolean; message: string }> => {
    const selectedPlan = plans.find(p => p.id === planId);
    if (!selectedPlan) return { success: false, message: "Selected plan not recognized." };
    if (!selectedPlan.enabled || selectedPlan.status !== "active") return { success: false, message: "This yield program is temporarily locked by platform nodes." };

    if (!Number.isFinite(amount) || amount <= 0) {
      return { success: false, message: "Please specify a valid numeric capital amount." };
    }
    if (amount < selectedPlan.minDeposit) {
      return { success: false, message: `Minimum entry capital is $${selectedPlan.minDeposit}.` };
    }
    if (amount > selectedPlan.maxDeposit) {
      return { success: false, message: `Maximum entry cap is $${selectedPlan.maxDeposit}.` };
    }
    if (user.balance < amount) {
      setInsufficientBalanceOpen(true);
      return { success: false, message: "INSUFFICIENT_BALANCE" };
    }
    if (!currentSupabaseUserId) {
      return { success: false, message: "You must be signed in to invest." };
    }

    const debitAmount = +amount.toFixed(2);
    const actionKey = `investment:${planId}:${debitAmount}`;
    const reservation = tryReserveBalanceDebit(actionKey, debitAmount);
    if (reservation === "duplicate") {
      return { success: false, message: "This investment request is already being processed." };
    }
    if (reservation === "insufficient") {
      setInsufficientBalanceOpen(true);
      return { success: false, message: "INSUFFICIENT_BALANCE" };
    }

    const newActive = buildActiveInvestment(selectedPlan, debitAmount);

    try {
      await purchaseInvestment({
        id: newActive.id,
        userId: currentSupabaseUserId,
        planId: selectedPlan.id,
        name: selectedPlan.name,
        amount: debitAmount,
        roiPercent: newActive.roiPercent ?? 0,
        expectedProfit: newActive.expectedProfit ?? 0,
        totalReturn: newActive.totalReturn ?? debitAmount,
        dailyRoiPercent: newActive.dailyRoiPercent ?? 0,
        startDate: newActive.startDate,
        endDate: newActive.endDate,
        remainingDays: newActive.remainingDays ?? selectedPlan.durationDays
      });
      await refetchCurrentUserProfile();
      releaseBalanceDebit(actionKey, debitAmount);
    } catch (error) {
      releaseBalanceDebit(actionKey, debitAmount);
      console.error("Failed to purchase investment:", error);
      toast.error("Failed to start investment. Please try again.");
      return { success: false, message: "Failed to process investment. Please try again." };
    }

    handleLog("Compound Allocation Enrolled", `Subscribed to ${selectedPlan.name} worth $${amount}.`, user.email || "system", "success");
    addNotification(`Your $${amount} allocation to ${selectedPlan.name} is now running.`, { title: "Investment started", type: "success", eventKey: `investment:started:${newActive.id}`, action: { label: "View portfolio", view: "dashboard-portfolio" } });
    dispatchTransactionalEmail(user.email, "INVESTMENT_STARTED", `investment:started:${newActive.id}`, { name: user.name, amount, planName: selectedPlan.name, investmentName: newActive.name, totalReturn: newActive.totalReturn, endDate: newActive.endDate, transactionId: newActive.id });

    toast.success(`Investment in ${selectedPlan.name} started successfully`);
    return { success: true, message: `Investment started. Total return at maturity: $${(newActive.totalReturn ?? 0).toLocaleString()}.` };
  };

  const claimPlanPayout = async (investmentId: string) => {
    const item = activeInvestments.find(inv => inv.id === investmentId);
    if (!item) return;

    try {
      await claimInvestmentPayout(investmentId);
      await refetchCurrentUserProfile();
      handleLog("Investment Payout Claimed", `Claimed payout for ${item.name}.`, user.email || "system", "success");
      addNotification(`Your investment in ${item.name} matured — payout credited to your balance.`, { title: "Investment matured", type: "success", eventKey: `investment:payout:${investmentId}`, action: { label: "View portfolio", view: "dashboard-portfolio" } });
      toast.success("Payout claimed successfully");
    } catch (error) {
      console.error("Failed to claim investment payout:", error);
      toast.error("Failed to claim payout. Please try again.");
    }
  };

  const topUpInvestment = async (investmentId: string, amount: number): Promise<{ success: boolean; message: string }> => {
    if (!user.isLoggedIn || !user.email) {
      return { success: false, message: "AUTH_REQUIRED" };
    }
    if (amount <= 0 || isNaN(amount)) {
      return { success: false, message: "Please enter a valid amount." };
    }
    if (user.balance < amount) {
      setInsufficientBalanceOpen(true);
      return { success: false, message: "INSUFFICIENT_BALANCE" };
    }

    const investment = activeInvestments.find(inv => inv.id === investmentId);
    if (!investment) {
      return { success: false, message: "Investment not found." };
    }
    if (investment.status === "Completed" || investment.status === "completed" || investment.payoutTransactionId) {
      return { success: false, message: "Completed investments cannot be topped up." };
    }

    const topUpAmount = +amount.toFixed(2);
    const actionKey = `topup:${investmentId}:${topUpAmount}`;
    const reservation = tryReserveBalanceDebit(actionKey, topUpAmount);
    if (reservation === "duplicate") {
      return { success: false, message: "This top-up is already being processed." };
    }
    if (reservation === "insufficient") {
      setInsufficientBalanceOpen(true);
      return { success: false, message: "INSUFFICIENT_BALANCE" };
    }

    try {
      await topUpInvestmentRpc(investmentId, topUpAmount);
      await refetchCurrentUserProfile();
      releaseBalanceDebit(actionKey, topUpAmount);
    } catch (error) {
      releaseBalanceDebit(actionKey, topUpAmount);
      console.error("Failed to top up investment:", error);
      return { success: false, message: "Failed to process top-up. Please try again." };
    }

    const topUpEventId = `investment:topup:${investmentId}:${Date.now()}`;
    handleLog("Investment Topped Up", `Added $${topUpAmount} to ${investment.name}.`, user.email, "success");
    addNotification(`Added $${topUpAmount} to your ${investment.name} investment.`, { title: "Investment topped up", type: "success", eventKey: topUpEventId });
    dispatchTransactionalEmail(user.email, "TOPUP_SUCCESS", topUpEventId, { name: user.name, investmentName: investment.name, amount: topUpAmount, transactionId: investmentId, status: "completed" });
    toast.success("Investment top-up completed successfully");
    return { success: true, message: "Top-up completed successfully." };
  };

  const assertAdminPermission = () => {
    if (!user.isLoggedIn || (user.role !== "admin" && user.isAdmin !== true)) {
      throw new Error("Platform permission is required to manage investment plans.");
    }
  };

  const adminCreatePlan = async (newPlan: Omit<InvestmentPlan, "id">) => {
    assertAdminPermission();

    try {
      const freshPlan = await createInvestmentPlanInDb(newPlan);
      handleLog("Yield Protocol Registered", `Added new Plan: ${newPlan.name} ROI ${newPlan.roiPercent}%`, user.email || "admin", "success");
      addNotification(`Created investment portfolio: ${freshPlan.name}`);
    } catch (error) {
      console.error("Failed to create investment plan:", error);
      toast.error("Failed to create investment plan.");
    }
  };

  const adminUpdatePlan = async (updated: InvestmentPlan) => {
    assertAdminPermission();

    try {
      await saveInvestmentPlanInDb(updated);
      handleLog("Yield Protocol Edited", `Modified configurations of ${updated.name}.`, user.email || "admin", "warning");
      addNotification(`Parameters altered on ${updated.name}`);
    } catch (error) {
      console.error("Failed to update investment plan:", error);
      toast.error("Failed to update investment plan.");
    }
  };

  const adminDeletePlan = async (planId: string) => {
    assertAdminPermission();

    try {
      await deleteInvestmentPlanInDb(planId);
      handleLog("Yield Protocol Deleted", `Terminated plan index code: ${planId}`, user.email || "admin", "alert");
    } catch (error) {
      console.error("Failed to delete investment plan:", error);
      toast.error("Failed to delete investment plan.");
    }
  };

  const adminSetPlanStatus = async (planId: string, statusValue: "active" | "paused") => {
    assertAdminPermission();

    try {
      await setInvestmentPlanEnabledInDb(planId, statusValue === "active");
      handleLog("Compounding Interval Status Shift", `Switched plan ${planId} status to ${statusValue}`, user.email || "admin", "warning");
    } catch (error) {
      console.error("Failed to update investment plan status:", error);
      toast.error("Failed to update investment plan status.");
    }
  };

  return (
    <InvestmentPlansContext.Provider value={{
      plans,
      adminActiveInvestments,
      investInPlan,
      claimPlanPayout,
      topUpInvestment,
      adminCreatePlan,
      adminUpdatePlan,
      adminDeletePlan,
      adminSetPlanStatus
    }}>
      {children}
    </InvestmentPlansContext.Provider>
  );
};

export const useInvestmentPlans = () => {
  const context = useContext(InvestmentPlansContext);
  if (context === undefined) {
    throw new Error("useInvestmentPlans must be used inside an InvestmentPlansProvider");
  }
  return context;
};
