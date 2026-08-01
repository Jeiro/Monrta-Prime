import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from "react";
import toast from "react-hot-toast";
import type {
  MarketAsset,
  TraderProfile,
  InvestmentPlan,
  DepositWallet,
  Transaction,
  UserState,
  Announcement,
  AuditLog,
  SiteContent,
  AppSettings,
  Airdrop,
  AirdropClaim,
  KycSubmission,
  WalletFeedback
} from "../types";
import {
  buildActiveInvestment,
  syncInvestmentCountdowns,
  buildAirdropClaim,
  findUserCampaignClaim,
  hasReachedClaimLimit,
  isAirdropActive,
  type BuildNotificationOptions,
  type NotificationItem,
  USE_MOCK_DATA,
  isAdminEmail,
  syncCopyTradeCountdowns,
  isAnnouncementRead
} from "../services";
import { useSession } from "./domains/SessionContext";
import { useAuditLog, useAuditLogWriter } from "./domains/AuditLogContext";
import { useSiteSettings } from "./domains/SiteSettingsContext";
import { useNotifications } from "./domains/NotificationsContext";
import { useAdminUsers, useAdminUsersData } from "./domains/AdminUsersContext";
import { useWallet } from "./domains/WalletContext";
import { useMarkets } from "./domains/MarketsContext";
import { useTraders } from "./domains/TradersContext";
import { useAnnouncements } from "../hooks/data/useAnnouncements";
import { useAirdrops } from "../hooks/data/useAirdrops";
import { type CoreUserProfile } from "../hooks/data/useUsersDirectory";
import { useKyc } from "../hooks/data/useKyc";
import { type AdminActiveInvestment } from "../hooks/data/useActiveInvestments";
import { usePortfolio } from "../hooks/data/usePortfolio";
import { type AdminCopyTrade } from "../hooks/data/useCopyTrades";
import { useSupportTickets, type AdminSupportTicket } from "../hooks/data/useSupportTickets";
import { useAirdropClaims } from "../hooks/data/useAirdropClaims";
import { useInvestmentPlans } from "./domains/InvestmentPlansContext";

interface AppContextType {
  user: UserState;
  marketCrypto: MarketAsset[];
  marketStocks: MarketAsset[];
  traders: TraderProfile[];
  plans: InvestmentPlan[];
  isLoadingMarkets: boolean;
  insufficientBalanceOpen: boolean;
  setInsufficientBalanceOpen: (open: boolean) => void;
  deposit: (amount: number, currency: string, txHash?: string, proofFile?: string) => boolean;
  withdraw: (
    amount: number,
    currency: string,
    address?: string,
    destinationTag?: string,
    bankDetails?: { accountNumber: string; bankName: string; accountName: string; routingCode: string },
    paypalEmail?: string
  ) => { success: boolean; message: string };
  investInPlan: (planId: string, amount: number) => Promise<{ success: boolean; message: string }>;
  claimPlanPayout: (investmentId: string) => void;
  claimAirdrop: (airdropId: string, token: string, rewardAmount: string) => void;
  withdrawEarnings: () => void;
  topUpInvestment: (investmentId: string, amount: number) => Promise<{ success: boolean; message: string }>;
  copyTrader: (traderId: string, amount: number) => Promise<{ success: boolean; message: string }>;
  uncopyTrader: (traderId: string) => Promise<{ success: boolean; message: string }>;
  claimCopyTradePayout: (copyTradeId: string) => Promise<void>;
  executeTrade: (symbol: string, name: string, type: "buy" | "sell", amount: number, price: number, isCrypto: boolean) => Promise<{ success: boolean; message: string }>;
  createTicket: (subject: string, category: "deposit" | "withdrawal" | "trading" | "general", initialMsg: string, priority?: "low" | "medium" | "high") => void;
  replyToTicket: (ticketId: string, text: string) => void;
  sendWelcomeNotification: (recipientEmail: string, recipientName?: string) => void;

  // Administrative Operations
  usersDirectory: CoreUserProfile[];
  isLoadingUsersDirectory: boolean;
  refreshUsersDirectory: () => Promise<void>;
  adminWallets: Record<string, string>;
  depositWallets: DepositWallet[];
  enabledDepositWallets: DepositWallet[];
  adminAnnouncements: Announcement[];
  userAnnouncements: Announcement[];
  adminAuditLogs: AuditLog[];
  adminAirdropClaims: AirdropClaim[];
  airdrops: Airdrop[];
  notifications: NotificationItem[];
  unreadNotificationsCount: number;
  markNotificationRead: (notificationId: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;

  updateAdminWallets: (wallets: Record<string, string>) => void;
  adminSaveDepositWallet: (wallet: DepositWallet | Omit<DepositWallet, "id">) => Promise<void>;
  adminDeleteDepositWallet: (walletId: string) => Promise<void>;
  adminUpdateUserBalance: (email: string, amount: number, txData?: { type: "credit" | "debit"; amount: number; label: string; notes: string; }) => Promise<void>;
  adminChangeUserStatus: (email: string, status: "active" | "suspended" | "banned") => void;
  adminResetUserPassword: (email: string) => void;
  adminKycReview: (email: string, status: "approved" | "rejected", reason?: string) => Promise<void>;

  adminCreatePlan: (plan: Omit<InvestmentPlan, "id">) => Promise<void>;
  adminUpdatePlan: (plan: InvestmentPlan) => Promise<void>;
  adminDeletePlan: (planId: string) => Promise<void>;
  adminSetPlanStatus: (planId: string, status: "active" | "paused") => Promise<void>;

  adminApproveDeposit: (txId: string, notes?: string) => void;
  adminRejectDeposit: (txId: string, notes?: string) => void;
  adminApproveWithdrawal: (txId: string, notes?: string) => void;
  adminRejectWithdrawal: (txId: string, notes?: string) => void;

  adminApproveAirdrop: (claimId: string) => void;
  adminRejectAirdrop: (claimId: string) => void;
  adminCreateAirdrop: (airdrop: Omit<Airdrop, "id">) => void;
  adminUpdateAirdrop: (airdrop: Airdrop) => void;
  adminDeleteAirdrop: (airdropId: string) => void;

  adminCreateAnnouncement: (announcement: Omit<Announcement, "id" | "date" | "updatedAt"> & Partial<Pick<Announcement, "id" | "date" | "updatedAt">>) => Promise<void>;
  adminUpdateAnnouncement: (announcement: Announcement) => Promise<void>;
  adminDeleteAnnouncement: (announcementId: string) => Promise<void>;
  markAnnouncementRead: (announcementId: string) => Promise<void>;

  adminReplyToTicket: (ticketId: string, text: string) => void;
  adminCloseTicket: (ticketId: string) => void;
  adminSetTicketPriority: (ticketId: string, priority: "low" | "medium" | "high") => void;
  supportTickets: AdminSupportTicket[];
  adminTransactions: Transaction[];
  adminActiveInvestments: AdminActiveInvestment[];
  adminCopyTrades: AdminCopyTrade[];
  allKycSubmissions: Record<string, KycSubmission>;

  addNotification: (text: string, options?: BuildNotificationOptions) => void;
  clearNotifications: () => void;
  submitKyc: (kyc: KycSubmission) => Promise<void>;
  saveWalletConnection: (walletName?: string) => void;

  // Real-time site content editing
  siteContent: SiteContent;
  updateSiteContent: (newContent: Partial<SiteContent>) => Promise<void>;
  appSettings: AppSettings;
  updateAppSettings: (settings: Partial<AppSettings>) => Promise<void>;

  // Real-time trader editing
  adminUpdateTrader: (traderId: string, updatedData: Partial<TraderProfile>) => Promise<void>;
  adminCreateTrader: (trader: Omit<TraderProfile, "id">) => Promise<void>;
  adminDeleteTrader: (traderId: string) => Promise<void>;

  // Wallet Feedback
  walletFeedback: WalletFeedback[];
  submitWalletFeedback: (wallet: string, reason: string, wouldUse: boolean) => Promise<void>;
  adminUpdateWalletFeedback: (id: string, status: "new" | "reviewed", adminNotes?: string) => Promise<void>;
  adminDeleteWalletFeedback: (id: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Re-exported for AdminContentTab.tsx, which imports this from here.
export { DEFAULT_SITE_CONTENT } from "../services/settingsService";

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    supabase,
    user,
    setUser,
    authReady,
    currentSupabaseUserId,
    currentUserProfile,
    refetchCurrentUserProfile,
    currentUserIsLoggedIn,
    currentUserIsAdmin,
    tryReserveBalanceDebit,
    releaseBalanceDebit
  } = useSession();
  const { handleLog } = useAuditLogWriter();
  const { adminAuditLogs } = useAuditLog();
  const { siteContent, appSettings, updateSiteContent, updateAppSettings } = useSiteSettings();
  const {
    notifications,
    unreadNotificationsCount,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
    addNotification,
    clearNotifications,
    notifyAdmins,
    dispatchTransactionalEmail,
    sendWelcomeNotification
  } = useNotifications();
  const { usersDirectory, isLoadingUsersDirectory, refreshUsersDirectory } = useAdminUsersData();
  const { adminUpdateUserBalance, adminChangeUserStatus, adminResetUserPassword } = useAdminUsers();
  const {
    adminTransactions,
    refreshTransactions,
    depositWallets,
    enabledDepositWallets,
    adminWallets,
    insufficientBalanceOpen,
    setInsufficientBalanceOpen,
    deposit,
    withdraw,
    updateAdminWallets,
    adminSaveDepositWallet,
    adminDeleteDepositWallet,
    adminApproveDeposit,
    adminRejectDeposit,
    adminApproveWithdrawal,
    adminRejectWithdrawal,
    saveWalletConnection,
    walletFeedback,
    submitWalletFeedback,
    adminUpdateWalletFeedback,
    adminDeleteWalletFeedback
  } = useWallet();
  const { marketCrypto, marketStocks, isLoadingMarkets } = useMarkets();
  const {
    plans,
    adminActiveInvestments,
    investInPlan,
    claimPlanPayout,
    topUpInvestment,
    adminCreatePlan,
    adminUpdatePlan,
    adminDeletePlan,
    adminSetPlanStatus
  } = useInvestmentPlans();
  const {
    traders,
    adminCopyTrades,
    copyTrader,
    uncopyTrader,
    claimCopyTradePayout,
    adminUpdateTrader,
    adminCreateTrader,
    adminDeleteTrader
  } = useTraders();

  const adminApproveAirdrop = async (claimId: string) => {
    const claim = adminAirdropClaims.find(c => c.id === claimId);
    if (!claim || claim.status !== "Pending") {
      addNotification("This airdrop claim has already been reviewed.");
      return;
    }

    const campaign = airdrops.find(item => item.id === claim.airdropId);
    const reward = parseFloat(claim.rewardAmount) || 0;

    try {
      await approveAirdropClaimInDb(claimId);
    } catch (e) {
      console.error("Error approving airdrop claim:", e);
      addNotification("Airdrop approval failed. Please review the claim again.");
      return;
    }

    await Promise.all([refreshUsersDirectory(), refreshTransactions()]);
    if (user.email && user.email.toLowerCase() === claim.userEmail.toLowerCase()) {
      await refetchCurrentUserProfile();
    }

    handleLog("Airdrop Claim Approved", `Credited ${claim.userEmail} $${reward.toFixed(2)} for ${claim.token}.`, user.email || "admin", "success");
    addNotification(`Airdrop claim approved and $${reward.toFixed(2)} credited.`, { title: "Airdrop approved", type: "success", eventKey: `admin:airdrop:approved:${claimId}` });
    addNotification(`Your ${claim.token} airdrop claim was approved and $${reward.toFixed(2)} credited.`, { title: "Airdrop approved", type: "success", recipientEmail: claim.userEmail, eventKey: `airdrop:approved:${claimId}`, action: { label: "View airdrops", view: "dashboard-airdrops" } });
    dispatchTransactionalEmail(claim.userEmail, "AIRDROP_CLAIM_APPROVED", `airdrop:approved:${claimId}`, {
      name: claim.userName || claim.userEmail.split("@")[0],
      campaignTitle: claim.campaignTitle || campaign?.title,
      token: claim.token,
      rewardAmount: claim.rewardAmount,
      amount: reward,
      claimId,
      transactionId: `tx-airdrop-${claimId}`,
      status: "approved"
    });
  };

  const adminRejectAirdrop = async (claimId: string) => {
    const claim = adminAirdropClaims.find(c => c.id === claimId);
    if (!claim || claim.status !== "Pending") {
      addNotification("This airdrop claim has already been reviewed.");
      return;
    }

    const campaign = airdrops.find(item => item.id === claim.airdropId);

    try {
      await rejectAirdropClaimInDb(claimId, "Rejected by admin.");
    } catch (e) {
      console.error("Error rejecting airdrop claim:", e);
      return;
    }

    handleLog("Airdrop Claim Rejected", `Rejected claim ${claimId} for ${claim.userEmail}.`, user.email || "admin", "warning");
    addNotification(`Airdrop claim ${claimId} rejected.`, { title: "Airdrop rejected", type: "warning", eventKey: `admin:airdrop:rejected:${claimId}` });
    addNotification(`Your ${claim.token} airdrop claim was rejected.`, { title: "Airdrop rejected", type: "error", recipientEmail: claim.userEmail, eventKey: `airdrop:rejected:${claimId}`, action: { label: "View airdrops", view: "dashboard-airdrops" } });
    dispatchTransactionalEmail(claim.userEmail, "AIRDROP_CLAIM_REJECTED", `airdrop:rejected:${claimId}`, {
      name: claim.userName || claim.userEmail.split("@")[0],
      campaignTitle: claim.campaignTitle || campaign?.title,
      token: claim.token,
      rewardAmount: claim.rewardAmount,
      claimId,
      reason: "Rejected by admin.",
      status: "rejected"
    });
  };

  const adminCreateAirdrop = async (airdrop: Omit<Airdrop, "id">) => {
    try {
      const newAirdrop = await createAirdropCampaign(airdrop);
      handleLog("Airdrop Campaign Created", `Created campaign ${newAirdrop.title}.`, user.email || "admin", "success");
      addNotification("Airdrop campaign created successfully.");
    } catch (error) {
      console.error("Failed to create airdrop campaign:", error);
      addNotification("Failed to create airdrop campaign.");
    }
  };

  const adminUpdateAirdrop = async (airdrop: Airdrop) => {
    try {
      const updated = await updateAirdropCampaign(airdrop);
      handleLog("Airdrop Campaign Updated", `Updated campaign ${updated.title}.`, user.email || "admin", "warning");
      addNotification("Airdrop campaign updated successfully.");
    } catch (error) {
      console.error("Failed to update airdrop campaign:", error);
      addNotification("Failed to update airdrop campaign.");
    }
  };

  const adminDeleteAirdrop = async (airdropId: string) => {
    try {
      await deleteAirdropCampaign(airdropId);
      handleLog("Airdrop Campaign Deleted", `Deleted campaign ${airdropId}.`, user.email || "admin", "alert");
      addNotification("Airdrop campaign deleted successfully.");
    } catch (error) {
      console.error("Failed to delete airdrop campaign:", error);
      addNotification("Failed to delete airdrop campaign.");
    }
  };

  const claimAirdrop = async (airdropId: string, token?: string, rewardAmount?: string) => {
    if (!user.email || !currentSupabaseUserId) return;
    const campaign = airdrops.find(item => item.id === airdropId);
    if (!campaign) {
      addNotification("This airdrop campaign is no longer available.");
      return;
    }
    if (!isAirdropActive(campaign)) {
      addNotification("This airdrop campaign is not active.");
      return;
    }
    if (findUserCampaignClaim(adminAirdropClaims, user.email, airdropId)) {
      addNotification("You already submitted a claim for this campaign.");
      return;
    }
    if (hasReachedClaimLimit(campaign, adminAirdropClaims)) {
      addNotification("This airdrop campaign has reached its claim limit.");
      return;
    }

    const newClaim = buildAirdropClaim(
      user.email,
      airdropId,
      token || campaign.token,
      rewardAmount || campaign.rewardAmount,
      campaign.title,
      user.name
    );

    try {
      await submitAirdropClaimInDb(newClaim.id, currentSupabaseUserId, airdropId, newClaim.token, newClaim.rewardAmount, campaign.title);
    } catch (error) {
      console.error("Failed to submit airdrop claim:", error);
      toast.error("Airdrop claims are temporarily unavailable. Please try again later.");
      return;
    }
    addNotification("Your airdrop claim has been submitted for platform approval.", { title: "Airdrop claim submitted", type: "info", eventKey: `airdrop:submitted:${newClaim.id}`, action: { label: "View airdrops", view: "dashboard-airdrops" } });
    dispatchTransactionalEmail(user.email, "AIRDROP_CLAIM_SUBMITTED", `airdrop:submitted:${newClaim.id}`, { name: user.name, campaignTitle: campaign.title, token: newClaim.token, rewardAmount: newClaim.rewardAmount, claimId: newClaim.id, status: "pending" });
    notifyAdmins(`${user.email || "A user"} submitted an airdrop claim for ${newClaim.token}.`, { title: "Airdrop claim requires review", type: "warning", eventKey: `airdrop:review:${newClaim.id}`, action: { label: "Review airdrops", view: "dashboard-admin" } });
    toast.success("Airdrop claim submitted successfully");
  };
  const withdrawEarnings = () => {
    if (!user.points || user.points < 100) return;
    const usdAmount = user.points * 1;
    setUser(prev => ({
      ...prev,
      balance: prev.balance + usdAmount,
      points: 0
    }));
    addNotification(`Withdrew $${usdAmount.toFixed(2)} to wallet.`);
  };




  // Sync live portfolio marks. Investment/copy-trade maturity payouts are
  // now claimed explicitly (via claimPlanPayout, using the atomic Supabase
  // RPC) rather than auto-credited here — auto-crediting on every price
  // tick would mean hitting the database every few seconds, and silently
  // paying out without user action isn't standard broker behavior anyway.
  useEffect(() => {
    setUser(prev => {
      if (!prev.isLoggedIn) return prev;

      let totalAssetVal = 0;
      let marksStale = false;
      const updatedPort = prev.portfolio.map(holding => {
        const matchingLive = [...marketCrypto, ...marketStocks].find(
          m => m.symbol.split("/")[0] === holding.symbol
        );
        if (matchingLive) {
          totalAssetVal += holding.amount * matchingLive.price;
          // A holding's stored mark counts as stale once it lags the live
          // price by ≥0.05% — bounded PER HOLDING, not on the total.
          // (A total-value threshold let individual marks drift visibly
          // out of sync with the live prices shown beside them whenever
          // gains and losses across holdings cancelled out.)
          if (
            !holding.currentPrice ||
            Math.abs(matchingLive.price - holding.currentPrice) >= holding.currentPrice * 0.0005
          ) {
            marksStale = true;
          }
          return { ...holding, currentPrice: matchingLive.price };
        }
        return holding;
      });

      // Skip rewriting `user` (which re-renders every consumer) only when
      // truly nothing meaningful moved: every mark within 0.05% of live
      // AND the total within a cent. Skipped drift accumulates against the
      // last-applied values, so staleness stays bounded at ~0.05%.
      if (!marksStale && Math.abs(totalAssetVal - prev.portfolioValue) < 0.01) {
        return prev;
      }

      return {
        ...prev,
        portfolio: updatedPort,
        portfolioValue: +totalAssetVal.toFixed(2)
      };
    });
    // user.portfolio.length matters: this effect derives portfolioValue from
    // prev.portfolio, but the holdings are seeded by a separate effect that
    // usually resolves AFTER the first market tick. Without this dependency
    // the value stayed at $0 — with the holdings visibly listed right beside
    // it — until the next tick happened to fire. Depending on the length (not
    // the array identity) means it re-derives when holdings arrive or change
    // count, while price movement stays covered by marketCrypto/marketStocks.
  }, [marketCrypto, marketStocks, plans, user.portfolio.length]);


  const executeTrade = async (
    symbol: string,
    name: string,
    type: "buy" | "sell",
    amount: number,
    price: number,
    isCrypto: boolean
  ): Promise<{ success: boolean; message: string }> => {
    if (!user.isLoggedIn || !user.email) {
      return { success: false, message: "AUTH_REQUIRED" };
    }
    if (amount <= 0 || isNaN(amount)) {
      return { success: false, message: "Please specify a valid trade amount." };
    }

    const quantity = +(amount / price).toFixed(6);

    if (type === "buy") {
      if (user.balance < amount) {
        return { success: false, message: "INSUFFICIENT_BALANCE" };
      }

      try {
        await buyAsset(symbol, name, amount, price, quantity, isCrypto ? "crypto" : "stock");
        await refetchCurrentUserProfile();
      } catch (error) {
        console.error("Failed to execute buy order:", error);
        return { success: false, message: "Failed to execute trade. Please try again." };
      }

      handleLog("Market Order Fulfilled", `Purchased $${amount} of ${symbol} at $${price}`, user.email, "success");
      addNotification(`Market Buy Executed: ${quantity} ${symbol.split("/")[0]} filled.`);
      toast.success("Trade executed successfully");

      return { success: true, message: `Market Buy Order completed successfully.` };

    } else {
      const holding = portfolio.find(p => p.symbol === symbol);
      if (!holding || holding.amount <= 0) {
        return { success: false, message: "You do not own any active holdings in this asset." };
      }
      if (holding.amount < quantity) {
        return { success: false, message: `Insufficient assets. You own ${holding.amount} units, but this sale requires ${quantity} units.` };
      }

      try {
        await sellAsset(symbol, amount, price, quantity);
        await refetchCurrentUserProfile();
      } catch (error) {
        console.error("Failed to execute sell order:", error);
        return { success: false, message: "Failed to execute trade. Please try again." };
      }

      handleLog("Market Sale Settled", `Liquidated ${quantity} ${symbol.split("/")[0]} for $${amount}`, user.email, "success");
      addNotification(`Market Sell Executed: ${quantity} ${symbol.split("/")[0]} discharged.`);
      toast.success("Trade executed successfully");
      return { success: true, message: `Market Sell Order completed successfully.` };
    }
  };

  const createTicket = async (
    subject: string,
    category: "deposit" | "withdrawal" | "trading" | "general",
    initialMsg: string,
    priority: "low" | "medium" | "high" = "medium"
  ) => {
    try {
      const ticketId = await createTicketInDb(subject, category, initialMsg, priority);
      handleLog("Support Ticket Created", `Submitted ticket regarding topic: ${subject}`, user.email || "guest@gmail.com", "success");
      dispatchTransactionalEmail(user.email, "SUPPORT_TICKET_CREATED", `ticket:created:${ticketId}`, { name: user.name, subject, category, reference: ticketId, status: "open" });

      // Auto simulated response
      setTimeout(() => {
        replyToTicketAsSupport(ticketId, `Dear Moneta Prime Member, thank you for writing. Dynamic agent node assigned. We are actively auditing your ${category} logs. Please stand by.`)
          .catch(error => console.error("Failed to send ticket auto-response:", error));
      }, 4000);
    } catch (error) {
      console.error("Failed to create support ticket:", error);
    }
  };

  const replyToTicket = async (ticketId: string, text: string) => {
    try {
      await replyToTicketInDb(ticketId, text);
      // Notify the support desk (the single configured support inbox) that the
      // user posted a reply — the "other direction" of ticket correspondence.
      const supportInbox = appSettings.supportEmail;
      if (supportInbox) {
        const ticket = user.tickets.find(t => t.id === ticketId);
        dispatchTransactionalEmail(supportInbox, "SUPPORT_TICKET_REPLY", `ticket:userreply:${ticketId}:${Date.now()}`, { name: "Support Team", subject: ticket?.subject || `Ticket ${ticketId}`, reference: ticketId, replyPreview: `${user.email || "A user"} replied: ${text.slice(0, 120)}` });
      }
    } catch (error) {
      console.error("Failed to reply to support ticket:", error);
    }
  };

  const {
    adminAnnouncements,
    userAnnouncements,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement
  } = useAnnouncements(supabase, authReady, currentUserIsLoggedIn, currentUserIsAdmin);
  const {
    airdrops,
    createAirdropCampaign,
    updateAirdropCampaign,
    deleteAirdropCampaign
  } = useAirdrops(supabase, authReady, currentUserIsLoggedIn);
  const {
    myKyc,
    allKycSubmissions,
    submitMyKyc,
    adminReviewKycByEmail
  } = useKyc(supabase, authReady, currentSupabaseUserId, currentUserIsAdmin);
  const { portfolio, buyAsset, sellAsset } = usePortfolio(supabase, authReady, currentSupabaseUserId);
  const {
    myTickets: supabaseTickets,
    allTickets: supportTickets,
    createTicket: createTicketInDb,
    replyToTicket: replyToTicketInDb,
    replyToTicketAsSupport,
    closeTicket: closeTicketInDb,
    setTicketPriority: setTicketPriorityInDb
  } = useSupportTickets(supabase, authReady, currentSupabaseUserId, currentUserIsAdmin);
  const {
    claims: adminAirdropClaims,
    submitClaim: submitAirdropClaimInDb,
    approveClaim: approveAirdropClaimInDb,
    rejectClaim: rejectAirdropClaimInDb
  } = useAirdropClaims(supabase, authReady, currentSupabaseUserId, currentUserIsAdmin);

  // Keep portfolio and copy trades in sync with their Supabase source.
  //
  // NOTE: every one of these overlay effects depends on `user.isLoggedIn` as
  // well as its hook data. The data hooks (gated on authReady + userId) can
  // resolve and fire this effect BEFORE the profile-loader sets isLoggedIn
  // true — e.g. right after a refresh, when Clerk briefly reports "loaded but
  // signed out" and authReady is flipped true early (see the signed-out branch
  // of the profile-loader). Without isLoggedIn in the deps, that early fire
  // hits the `prev.isLoggedIn ? … : prev` guard as a no-op and never re-runs
  // (the hook data reference doesn't change again), stranding the fetched data
  // and leaving the whole dashboard empty. Re-running when isLoggedIn flips
  // true re-applies the already-fetched data.
  useEffect(() => {
    setUser(prev => prev.isLoggedIn ? { ...prev, portfolio } : prev);
  }, [portfolio, user.isLoggedIn]);


  // Keep support tickets in sync with their Supabase source.
  useEffect(() => {
    setUser(prev => prev.isLoggedIn ? { ...prev, tickets: supabaseTickets } : prev);
  }, [supabaseTickets, user.isLoggedIn]);

  const adminKycReview = async (email: string, status: "approved" | "rejected", reason?: string): Promise<void> => {
    try {
      const targetProfile = usersDirectory.find(item => item.email.toLowerCase() === email.toLowerCase());
      if (!targetProfile?.id) throw new Error(`No Supabase user record found for ${email}.`);
      const notes = reason || (status === "approved" ? "Verified by admin." : "Documents not sufficient.");

      const reviewedKyc = await adminReviewKycByEmail(email, targetProfile.id, status, notes);

      if (user.email && user.email.toLowerCase() === email.toLowerCase()) {
        setUser(prev => ({ ...prev, kyc: reviewedKyc }));
      }
      handleLog("KYC Verification Result", `Verification team reviewed KYC for ${email}. Result: ${status}.`, user.email || "system", status === "approved" ? "success" : "alert");
      addNotification(`KYC verification for ${email} marked as ${status}.`, { title: `KYC ${status}`, type: status === "approved" ? "success" : "warning", eventKey: `admin:kyc:${status}:${email}` });
      addNotification(status === "approved" ? "Your KYC verification was approved." : "Your KYC verification was rejected. Please review the notes and resubmit.", { title: status === "approved" ? "KYC approved" : "KYC rejected", type: status === "approved" ? "success" : "error", recipientEmail: email, eventKey: `kyc:${status}:${email}:${reviewedKyc.reviewedAt || reviewedKyc.submissionDate}`, action: { label: "View KYC", view: "dashboard-kyc" } });
      dispatchTransactionalEmail(email, status === "approved" ? "KYC_APPROVED" : "KYC_REJECTED", `kyc:${status}:${email}:${reviewedKyc.reviewedAt || reviewedKyc.submissionDate}`, { name: targetProfile?.name || email.split("@")[0], documentType: reviewedKyc.documentType || reviewedKyc.idType, reason: reviewedKyc.rejectionReason || reason, status });
    } catch (e) {
      toast.error("Failed to update KYC review");
      throw e;
    }
  };

  const submitKyc = async (kyc: KycSubmission): Promise<void> => {
    if (!user.email) throw new Error("You must be signed in to submit KYC.");
    if (!currentSupabaseUserId) throw new Error("You must be signed in to submit KYC.");
    try {
      const submission = await submitMyKyc(currentSupabaseUserId, kyc);

      setUser(prev => ({ ...prev, kyc: submission }));
      addNotification("Your KYC submission has been received and is being reviewed.", { title: "KYC submitted", type: "info", eventKey: `kyc:submitted:${submission.submissionDate || user.email}`, action: { label: "View KYC", view: "dashboard-kyc" } });
      dispatchTransactionalEmail(user.email, "KYC_SUBMITTED", `kyc:submitted:${submission.submissionDate || user.email}`, { name: user.name, documentType: submission.documentType || submission.idType, status: "pending" });
      notifyAdmins(`${user.email} submitted KYC documents for review.`, { title: "KYC requires review", type: "warning", eventKey: `kyc:review:${user.email}:${submission.submissionDate || submission.idNumber}`, action: { label: "Review KYC", view: "dashboard-admin" } });
      toast.success("KYC documents submitted for review");
    } catch (e) {
      toast.error("Failed to submit KYC documents");
      throw e;
    }
  };

  const adminCreateAnnouncement = async (announcement: Omit<Announcement, "id" | "date" | "updatedAt"> & Partial<Pick<Announcement, "id" | "date" | "updatedAt">>) => {
    const fresh = await createAnnouncement(announcement);
    handleLog("Announcement Published", `Added announcement: ${fresh.title}`, user.email || "admin", "success");
    addNotification(`Global announcement published: "${fresh.title}".`, { title: "Announcement published", type: "success", eventKey: `admin:announcement:${fresh.id}` });
    usersDirectory.filter(target => target.role !== "admin" && !isAdminEmail(target.email)).forEach(target => {
      addNotification(fresh.content, { title: fresh.title, type: fresh.priority === "Critical" ? "warning" : "info", recipientEmail: target.email, eventKey: `announcement:${fresh.id}:${target.email}`, action: { label: "View dashboard", view: "dashboard" } });
    });
  };

  const adminUpdateAnnouncement = async (announcement: Announcement) => {
    const updated = await updateAnnouncement(announcement);
    handleLog("Announcement Updated", `Updated announcement: ${updated.title}`, user.email || "admin", "warning");
  };

  const adminDeleteAnnouncement = async (id: string) => {
    await deleteAnnouncement(id);
    handleLog("Announcement Deleted", `Removed announcement ID: ${id}`, user.email || "admin", "warning");
  };

  const markAnnouncementRead = async (announcementId: string) => {
    if (!user.email || isAnnouncementRead(announcementId, user.readAnnouncementIds)) return;

    const readAnnouncementIds = [...(user.readAnnouncementIds || []), announcementId];
    setUser(prev => ({ ...prev, readAnnouncementIds }));

    if (!USE_MOCK_DATA) {
      if (currentSupabaseUserId) {
        const { error } = await supabase
          .from("user_read_announcements")
          .upsert({ user_id: currentSupabaseUserId, announcement_id: announcementId }, { onConflict: "user_id,announcement_id" });
        if (error) console.error("Failed to sync read-announcement to Supabase:", error);
      }
    }
  };

  const adminReplyToTicket = async (ticketId: string, replyText: string) => {
    try {
      await replyToTicketAsSupport(ticketId, replyText);
      handleLog("Ticket Replied", `Dispatched help-desk payload to Ticket ID: ${ticketId}`, user.email || "admin", "success");
      const ticket = supportTickets.find(t => t.id === ticketId);
      if (ticket?.userEmail) {
        dispatchTransactionalEmail(ticket.userEmail, "SUPPORT_TICKET_REPLY", `ticket:reply:${ticketId}:${Date.now()}`, { name: ticket.userEmail.split("@")[0], subject: ticket.subject, reference: ticketId, replyPreview: replyText.slice(0, 140) });
      }
    } catch (e) {
      console.error("Error replying to ticket:", e);
    }
  };

  const adminCloseTicket = async (ticketId: string) => {
    try {
      await closeTicketInDb(ticketId);
      handleLog("Ticket Finalised", `Flagged Ticket ID: ${ticketId} resolved.`, user.email || "admin", "success");
    } catch (e) {
      console.error("Error closing ticket:", e);
    }
  };

  const adminSetTicketPriority = async (ticketId: string, rate: "low" | "medium" | "high") => {
    try {
      await setTicketPriorityInDb(ticketId, rate);
    } catch (e) {
      console.error("Error setting ticket priority:", e);
    }
  };

  return (
    <AppContext.Provider value={{
      user,
      marketCrypto,
      marketStocks,
      traders,
      plans,
      isLoadingMarkets,
      insufficientBalanceOpen,
      setInsufficientBalanceOpen,
      deposit,
      withdraw,
      investInPlan,
      claimPlanPayout,
      claimAirdrop,
      withdrawEarnings,
      copyTrader,
      uncopyTrader,
      claimCopyTradePayout,
      executeTrade,
      createTicket,
      replyToTicket,
      sendWelcomeNotification,

      // Administrative Exports
      usersDirectory,
      isLoadingUsersDirectory,
      refreshUsersDirectory,
      adminWallets,
      depositWallets,
      enabledDepositWallets,
      adminAnnouncements,
      userAnnouncements,
      adminAuditLogs,
      adminAirdropClaims,
      airdrops,
      notifications,
      unreadNotificationsCount,
      markNotificationRead,
      markAllNotificationsRead,
      deleteNotification,

      updateAdminWallets,
      adminSaveDepositWallet,
      adminDeleteDepositWallet,
      adminUpdateUserBalance,
      adminChangeUserStatus,
      adminResetUserPassword,
      adminKycReview,

      adminCreatePlan,
      adminUpdatePlan,
      adminDeletePlan,
      adminSetPlanStatus,
      topUpInvestment,

      adminApproveDeposit,
      adminRejectDeposit,
      adminApproveWithdrawal,
      adminRejectWithdrawal,
      adminApproveAirdrop,
      adminRejectAirdrop,
      adminCreateAirdrop,
      adminUpdateAirdrop,
      adminDeleteAirdrop,

      adminCreateAnnouncement,
      adminUpdateAnnouncement,
      adminDeleteAnnouncement,
      markAnnouncementRead,

      adminReplyToTicket,
      adminCloseTicket,
      adminSetTicketPriority,
      supportTickets,
      adminTransactions,
      adminActiveInvestments,
      adminCopyTrades,
      allKycSubmissions,

      addNotification,
      clearNotifications,
      submitKyc,
      saveWalletConnection,

      // Wallet Feedback
      walletFeedback,
      submitWalletFeedback,
      adminUpdateWalletFeedback,
      adminDeleteWalletFeedback,

      // Site content editing
      siteContent,
      updateSiteContent,
      appSettings,
      updateAppSettings,

      // Trader editing
      adminUpdateTrader,
      adminCreateTrader,
      adminDeleteTrader
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used inside an AppProvider");
  }
  return context;
};