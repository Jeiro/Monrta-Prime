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
import { useTraders } from "../hooks/data/useTraders";
import { useAnnouncements } from "../hooks/data/useAnnouncements";
import { useAirdrops } from "../hooks/data/useAirdrops";
import { type CoreUserProfile } from "../hooks/data/useUsersDirectory";
import { useKyc } from "../hooks/data/useKyc";
import { useActiveInvestments, type AdminActiveInvestment } from "../hooks/data/useActiveInvestments";
import { usePortfolio } from "../hooks/data/usePortfolio";
import { useCopyTrades, type AdminCopyTrade } from "../hooks/data/useCopyTrades";
import { useSupportTickets, type AdminSupportTicket } from "../hooks/data/useSupportTickets";
import { useAirdropClaims } from "../hooks/data/useAirdropClaims";
import { useInvestmentPlans } from "../hooks/data/useInvestmentPlans";

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
  const {
    plans,
    createPlan: createInvestmentPlanInDb,
    savePlan: saveInvestmentPlanInDb,
    deletePlan: deleteInvestmentPlanInDb,
    setPlanEnabled: setInvestmentPlanEnabledInDb
  } = useInvestmentPlans(supabase);

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

  const [marketCrypto, setMarketCrypto] = useState<MarketAsset[]>([]);
  const [marketStocks, setMarketStocks] = useState<MarketAsset[]>([]);
  const [isLoadingMarkets, setIsLoadingMarkets] = useState<boolean>(true);

  useEffect(() => {
    localStorage.setItem("orbitrio_plans_v3", JSON.stringify(plans));
  }, []);

  // Load Markets Data
  const loadMarketsData = async () => {
    try {
      const res = await fetch("/api/markets");
      if (res.ok) {
        const data = await res.json();
        const processedCrypto = data.crypto.map((c: any) => ({
          ...c,
          sparkline: Array.from({ length: 12 }, () => c.price * (1 + (Math.random() * 0.04 - 0.02)))
        }));
        const processedStocks = data.stocks.map((s: any) => ({
          ...s,
          sparkline: Array.from({ length: 12 }, () => s.price * (1 + (Math.random() * 0.02 - 0.01)))
        }));
        setMarketCrypto(processedCrypto);
        setMarketStocks(processedStocks);
      } else {
        throw new Error("API failed");
      }
    } catch (e) {
      const mockC: MarketAsset[] = [
        { symbol: "BTC/USD", name: "Bitcoin", price: 98400.00, change: 2.45, high: 99200.00, low: 97100.00, volume: "24.1B", sparkline: [98100, 98300, 97900, 98200, 98900, 98600, 99100, 98900, 99200, 98400.00] },
        { symbol: "ETH/USD", name: "Ethereum", price: 3412.80, change: -1.22, high: 3520.00, low: 3380.00, volume: "12.8B", sparkline: [3480, 3460, 3490, 3450, 3420, 3440, 3410, 3430, 3405, 3412.8] },
        { symbol: "SOL/USD", name: "Solana", price: 187.65, change: 5.82, high: 191.00, low: 175.20, volume: "4.5B", sparkline: [176, 178, 175, 180, 182, 185, 183, 188, 186, 187.65] },
        { symbol: "XRP/USD", name: "Ripple", price: 1.14, change: 10.15, high: 1.22, low: 1.02, volume: "3.2B", sparkline: [1.01, 1.03, 1.05, 1.02, 1.08, 1.12, 1.10, 1.15, 1.13, 1.14] },
        { symbol: "ADA/USD", name: "Cardano", price: 0.62, change: -0.45, high: 0.65, low: 0.61, volume: "850M", sparkline: [0.63, 0.64, 0.62, 0.63, 0.61, 0.62, 0.62, 0.63, 0.61, 0.62] },
        { symbol: "BNB/USD", name: "Binance Coin", price: 580.40, change: 1.15, high: 590.00, low: 572.00, volume: "1.2B", sparkline: [570, 574, 572, 576, 578, 582, 580, 584, 582, 580.4] },
        { symbol: "DOT/USD", name: "Polkadot", price: 6.35, change: -2.31, high: 6.60, low: 6.25, volume: "180M", sparkline: [6.5, 6.4, 6.45, 6.35, 6.3, 6.38, 6.32, 6.35] },
        { symbol: "DOGE/USD", name: "Dogecoin", price: 0.154, change: 4.82, high: 0.162, low: 0.145, volume: "950M", sparkline: [0.142, 0.145, 0.148, 0.146, 0.151, 0.153, 0.154] },
        { symbol: "SHIB/USD", name: "Shiba Inu", price: 0.000018, change: 3.12, high: 0.000019, low: 0.000017, volume: "420M", sparkline: [0.000017, 0.0000175, 0.000018] },
        { symbol: "LTC/USD", name: "Litecoin", price: 82.40, change: -0.85, high: 84.10, low: 81.50, volume: "350M", sparkline: [83.1, 82.8, 83.2, 82.5, 82.9, 82.4] },
        { symbol: "LINK/USD", name: "Chainlink", price: 15.20, change: 1.74, high: 15.60, low: 14.80, volume: "210M", sparkline: [14.9, 15.0, 14.85, 15.1, 15.2] },
        { symbol: "UNI/USD", name: "Uniswap", price: 7.85, change: -1.45, high: 8.10, low: 7.70, volume: "160M", sparkline: [7.95, 7.9, 7.82, 7.88, 7.85] },
        { symbol: "AVAX/USD", name: "Avalanche", price: 34.60, change: 2.11, high: 35.80, low: 33.20, volume: "280M", sparkline: [33.8, 34.1, 33.9, 34.4, 34.6] },
        { symbol: "MATIC/USD", name: "Polygon", price: 0.58, change: -0.92, high: 0.61, low: 0.56, volume: "110M", sparkline: [0.59, 0.585, 0.58] },
        { symbol: "TON/USD", name: "Toncoin", price: 7.15, change: 6.25, high: 7.35, low: 6.65, volume: "340M", sparkline: [6.7, 6.9, 7.0, 7.12, 7.15] },
        { symbol: "TRX/USD", name: "TRON", price: 0.118, change: 0.45, high: 0.122, low: 0.115, volume: "250M", sparkline: [0.116, 0.117, 0.118] },
        { symbol: "XLM/USD", name: "Stellar", price: 0.124, change: 1.25, high: 0.128, low: 0.121, volume: "90M", sparkline: [0.122, 0.123, 0.124] },
        { symbol: "ATOM/USD", name: "Cosmos", price: 8.45, change: -2.15, high: 8.80, low: 8.35, volume: "130M", sparkline: [8.65, 8.52, 8.45] },
        { symbol: "NEAR/USD", name: "NEAR Protocol", price: 5.65, change: 3.42, high: 5.85, low: 5.40, volume: "220M", sparkline: [5.42, 5.55, 5.65] },
        { symbol: "ALGO/USD", name: "Algorand", price: 0.185, change: -1.12, high: 0.192, low: 0.181, volume: "65M", sparkline: [0.187, 0.184, 0.185] },
        { symbol: "FTM/USD", name: "Fantom", price: 0.82, change: 5.14, high: 0.85, low: 0.77, volume: "105M", sparkline: [0.78, 0.80, 0.82] },
        { symbol: "ICP/USD", name: "Internet Computer", price: 11.40, change: -1.82, high: 11.90, low: 11.20, volume: "95M", sparkline: [11.6, 11.5, 11.4] },
        { symbol: "HBAR/USD", name: "Hedera", price: 0.082, change: -0.42, high: 0.086, low: 0.080, volume: "75M", sparkline: [0.083, 0.082] },
        { symbol: "APT/USD", name: "Aptos", price: 9.15, change: 2.85, high: 9.45, low: 8.80, volume: "155M", sparkline: [8.85, 9.02, 9.15] },
        { symbol: "SUI/USD", name: "Sui", price: 1.25, change: 4.15, high: 1.32, low: 1.18, volume: "185M", sparkline: [1.19, 1.22, 1.25] },
        { symbol: "OP/USD", name: "Optimism", price: 2.15, change: -2.44, high: 2.25, low: 2.10, volume: "140M", sparkline: [2.21, 2.18, 2.15] },
        { symbol: "ARB/USD", name: "Arbitrum", price: 0.95, change: -1.85, high: 0.99, low: 0.92, volume: "125M", sparkline: [0.97, 0.96, 0.95] },
        { symbol: "FIL/USD", name: "Filecoin", price: 5.40, change: 1.12, high: 5.60, low: 5.25, volume: "80M", sparkline: [5.32, 5.38, 5.40] },
        { symbol: "VET/USD", name: "VeChain", price: 0.034, change: -0.58, high: 0.036, low: 0.033, volume: "55M", sparkline: [0.0345, 0.034] },
        { symbol: "LDO/USD", name: "Lido DAO", price: 1.85, change: 2.20, high: 1.92, low: 1.78, volume: "115M", sparkline: [1.81, 1.83, 1.85] },
        { symbol: "GRT/USD", name: "The Graph", price: 0.28, change: 3.14, high: 0.30, low: 0.27, volume: "90M", sparkline: [0.27, 0.275, 0.28] },
        { symbol: "RNDR/USD", name: "Render Token", price: 8.85, change: 7.42, high: 9.15, low: 8.10, volume: "260M", sparkline: [8.2, 8.5, 8.85] },
        { symbol: "AAVE/USD", name: "Aave", price: 110.15, change: 1.25, high: 115.00, low: 108.30, volume: "145M", sparkline: [108.9, 109.5, 110.15] },
        { symbol: "MKR/USD", name: "Maker", price: 2320.00, change: -1.18, high: 2390.00, low: 2280.00, volume: "85M", sparkline: [2350, 2330, 2320] },
        { symbol: "INJ/USD", name: "Injective", price: 22.40, change: 4.85, high: 23.50, low: 21.05, volume: "120M", sparkline: [21.2, 21.8, 22.4] },
        { symbol: "RUNE/USD", name: "THORChain", price: 5.15, change: -3.12, high: 5.40, low: 5.02, volume: "95M", sparkline: [5.32, 5.21, 5.15] },
        { symbol: "IMX/USD", name: "Immutable", price: 1.45, change: 2.11, high: 1.52, low: 1.38, volume: "75M", sparkline: [1.39, 1.42, 1.45] },
        { symbol: "FET/USD", name: "Fetch.ai", price: 1.62, change: 8.42, high: 1.70, low: 1.48, volume: "190M", sparkline: [1.50, 1.55, 1.62] },
        { symbol: "FLOW/USD", name: "Flow", price: 0.65, change: -0.45, high: 0.68, low: 0.61, volume: "45M", sparkline: [0.66, 0.64, 0.65] },
        { symbol: "WIF/USD", name: "dogwifhat", price: 2.15, change: 12.14, high: 2.30, low: 1.85, volume: "210M", sparkline: [1.90, 2.05, 2.15] },
        { symbol: "PEPE/USD", name: "Pepe", price: 0.000012, change: 9.25, high: 0.000013, low: 0.000011, volume: "320M", sparkline: [0.000011, 0.0000115, 0.000012] },
        { symbol: "STX/USD", name: "Stacks", price: 1.82, change: -1.75, high: 1.90, low: 1.76, volume: "110M", sparkline: [1.88, 1.84, 1.82] },
        { symbol: "THETA/USD", name: "Theta Network", price: 2.35, change: 3.12, high: 2.45, low: 2.22, volume: "80M", sparkline: [2.25, 2.30, 2.35] },
        { symbol: "EGLD/USD", name: "MultiversX", price: 34.50, change: -1.82, high: 35.90, low: 33.80, volume: "50M", sparkline: [35.2, 34.8, 34.5] },
        { symbol: "SAND/USD", name: "The Sandbox", price: 0.38, change: -0.42, high: 0.40, low: 0.36, volume: "60M", sparkline: [0.39, 0.385, 0.38] },
        { symbol: "MANA/USD", name: "Decentraland", price: 0.42, change: 1.15, high: 0.44, low: 0.40, volume: "55M", sparkline: [0.41, 0.415, 0.42] },
        { symbol: "FIDA/USD", name: "Bonfida", price: 0.28, change: 0.95, high: 0.30, low: 0.26, volume: "15M", sparkline: [0.27, 0.275, 0.28] },
        { symbol: "CHZ/USD", name: "Chiliz", price: 0.095, change: 2.85, high: 0.098, low: 0.091, volume: "40M", sparkline: [0.091, 0.093, 0.095] },
        { symbol: "ENS/USD", name: "Ethereum Name Service", price: 16.40, change: 5.12, high: 17.20, low: 15.80, volume: "65M", sparkline: [15.5, 16.0, 16.4] },
        { symbol: "CRV/USD", name: "Curve DAO Token", price: 0.32, change: -1.45, high: 0.34, low: 0.31, volume: "35M", sparkline: [0.33, 0.325, 0.32] },
        { symbol: "GALA/USD", name: "Gala", price: 0.038, change: 4.25, high: 0.040, low: 0.036, volume: "75M", sparkline: [0.036, 0.037, 0.038] },
        { symbol: "JUP/USD", name: "Jupiter", price: 0.98, change: 6.82, high: 1.05, low: 0.92, volume: "125M", sparkline: [0.91, 0.95, 0.98] }
      ];
      const mockS: MarketAsset[] = [
        { symbol: "AAPL", name: "Apple Inc.", price: 182.30, change: 0.85, high: 183.50, low: 180.80, volume: "52.4M", sparkline: [181.2, 181.5, 180.8, 181.9, 182.1, 182.3] },
        { symbol: "TSLA", name: "Tesla Inc.", price: 214.50, change: -3.42, high: 221.00, low: 212.30, volume: "83.1M", sparkline: [219.5, 218.0, 216.5, 217.2, 215.1, 214.5] },
        { symbol: "NVDA", name: "NVIDIA Corp.", price: 924.80, change: 4.12, high: 935.00, low: 885.00, volume: "41.6M", sparkline: [889, 895, 902, 915, 910, 924.8] },
        { symbol: "MSFT", name: "Microsoft Corp.", price: 415.60, change: 0.42, high: 418.00, low: 412.50, volume: "22.8M", sparkline: [412, 414, 413, 416, 415.6] },
        { symbol: "AMZN", name: "Amazon.com Inc.", price: 178.90, change: -1.15, high: 181.20, low: 177.50, volume: "32.1M", sparkline: [180.5, 179.8, 178.9] },
        { symbol: "GOOGL", name: "Alphabet Inc.", price: 172.50, change: 1.22, high: 174.10, low: 170.80, volume: "25.4M", sparkline: [170.2, 171.4, 172.5] },
        { symbol: "META", name: "Meta Platforms Inc.", price: 475.20, change: 2.15, high: 480.50, low: 468.20, volume: "18.2M", sparkline: [468.5, 471.2, 475.2] },
        { symbol: "NFLX", name: "Netflix Inc.", price: 610.40, change: -1.82, high: 622.00, low: 605.50, volume: "8.5M", sparkline: [618, 615, 610.4] },
        { symbol: "AMD", name: "Advanced Micro Devices", price: 164.80, change: -2.45, high: 170.10, low: 162.30, volume: "42.1M", sparkline: [168.2, 166.5, 164.8] },
        { symbol: "INTC", name: "Intel Corp.", price: 30.15, change: -0.85, high: 30.90, low: 29.80, volume: "35.2M", sparkline: [30.4, 30.2, 30.15] },
        { symbol: "PYPL", name: "PayPal Holdings", price: 62.40, change: 0.45, high: 63.20, low: 61.80, volume: "12.4M", sparkline: [62.0, 62.2, 62.4] },
        { symbol: "ADBE", name: "Adobe Inc.", price: 482.60, change: 1.05, high: 488.50, low: 477.15, volume: "4.8M", sparkline: [478.5, 480.1, 482.6] },
        { symbol: "CRM", name: "Salesforce Inc.", price: 278.40, change: -1.15, high: 282.00, low: 275.50, volume: "7.2M", sparkline: [280, 279, 278.4] },
        { symbol: "COIN", name: "Coinbase Global", price: 232.10, change: 6.85, high: 240.50, low: 221.80, volume: "15.6M", sparkline: [220, 225, 232.1] },
        { symbol: "QCOM", name: "QUALCOMM Inc.", price: 173.20, change: 0.95, high: 175.50, low: 171.10, volume: "9.2M", sparkline: [171.5, 172.4, 173.2] },
        { symbol: "AVGO", name: "Broadcom Inc.", price: 1350.20, change: 1.82, high: 1370.00, low: 1335.50, volume: "3.1M", sparkline: [1330, 1342, 1350.2] },
        { symbol: "ASML", name: "ASML Holding", price: 915.40, change: -1.12, high: 928.00, low: 902.50, volume: "2.4M", sparkline: [922, 918, 915.4] },
        { symbol: "MU", name: "Micron Technology", price: 112.50, change: 3.42, high: 115.20, low: 108.40, volume: "21.5M", sparkline: [108.9, 110.5, 112.5] },
        { symbol: "AMAT", name: "Applied Materials", price: 205.80, change: 0.65, high: 208.90, low: 203.10, volume: "6.8M", sparkline: [204.2, 205.1, 205.8] },
        { symbol: "TXN", name: "Texas Instruments", price: 168.40, change: -0.35, high: 170.20, low: 166.80, volume: "5.1M", sparkline: [169.1, 168.7, 168.4] },
        { symbol: "COST", name: "Costco Wholesale", price: 725.60, change: 0.82, high: 730.50, low: 720.10, volume: "4.2M", sparkline: [721.2, 723.4, 725.6] },
        { symbol: "PEP", name: "PepsiCo Inc.", price: 171.20, change: -0.22, high: 173.00, low: 169.80, volume: "5.5M", sparkline: [171.5, 171.3, 171.2] },
        { symbol: "SBUX", name: "Starbucks Corp.", price: 82.40, change: -1.45, high: 84.00, low: 81.50, volume: "7.8M", sparkline: [83.5, 83.0, 82.4] },
        { symbol: "NKE", name: "Nike Inc.", price: 95.15, change: 0.15, high: 96.50, low: 94.20, volume: "8.1M", sparkline: [95.0, 95.15] },
        { symbol: "DIS", name: "Walt Disney Co.", price: 114.30, change: -0.85, high: 116.00, low: 113.10, volume: "9.6M", sparkline: [115.2, 114.3] },
        { symbol: "CMG", name: "Chipotle Mexican Grill", price: 298.50, change: 1.55, high: 301.00, low: 295.00, volume: "1.1M", sparkline: [293.0, 298.5] },
        { symbol: "LULU", name: "Lululemon Athletica", price: 345.20, change: -4.12, high: 362.00, low: 341.00, volume: "2.8M", sparkline: [358.0, 345.2] },
        { symbol: "MSTR", name: "MicroStrategy Inc.", price: 1420.50, change: 11.22, high: 1480.00, low: 1310.00, volume: "6.2M", sparkline: [1310, 1420.5] },
        { symbol: "PANW", name: "Palo Alto Networks", price: 292.80, change: -1.35, high: 298.00, low: 289.50, volume: "3.5M", sparkline: [295, 292.8] },
        { symbol: "FTNT", name: "Fortinet Inc.", price: 61.20, change: 0.75, high: 62.10, low: 60.50, volume: "4.4M", sparkline: [60.8, 61.2] },
        { symbol: "ZS", name: "Zscaler Inc.", price: 182.40, change: -2.15, high: 188.00, low: 179.50, volume: "2.9M", sparkline: [186, 182.4] },
        { symbol: "DDOG", name: "Datadog Inc.", price: 118.50, change: 1.15, high: 121.20, low: 116.40, volume: "3.8M", sparkline: [117, 118.5] },
        { symbol: "ORCL", name: "Oracle Corp.", price: 124.50, change: 1.15, high: 126.00, low: 123.20, volume: "10.4M", sparkline: [123.5, 124.5] },
        { symbol: "CSCO", name: "Cisco Systems Inc.", price: 47.80, change: -0.42, high: 48.30, low: 47.10, volume: "15.2M", sparkline: [48.1, 47.8] },
        { symbol: "ABNB", name: "Airbnb Inc.", price: 148.60, change: 2.15, high: 151.20, low: 145.80, volume: "4.8M", sparkline: [145.2, 148.6] },
        { symbol: "UBER", name: "Uber Technologies", price: 68.40, change: 3.22, high: 69.50, low: 66.85, volume: "18.5M", sparkline: [66.5, 68.4] },
        { symbol: "SNOW", name: "Snowflake Inc.", price: 152.30, change: -4.15, high: 158.40, low: 150.10, volume: "6.2M", sparkline: [156.4, 152.3] },
        { symbol: "PLTR", name: "Palantir Technologies", price: 24.50, change: 8.12, high: 25.40, low: 22.80, volume: "38.4M", sparkline: [22.4, 24.5] },
        { symbol: "NET", name: "Cloudflare Inc.", price: 92.15, change: -1.85, high: 95.00, low: 90.80, volume: "5.1M", sparkline: [93.5, 92.15] },
        { symbol: "SHOP", name: "Shopify Inc.", price: 74.80, change: 0.95, high: 76.20, low: 73.10, volume: "9.6M", sparkline: [73.5, 74.8] },
        { symbol: "MDB", name: "MongoDB Inc.", price: 365.40, change: -3.42, high: 375.00, low: 360.50, volume: "2.1M", sparkline: [372.0, 365.4] },
        { symbol: "NOW", name: "ServiceNow Inc.", price: 742.60, change: 1.12, high: 748.50, low: 735.00, volume: "1.8M", sparkline: [738.0, 742.6] },
        { symbol: "SQ", name: "Block Inc.", price: 65.15, change: 2.45, high: 66.80, low: 63.90, volume: "11.2M", sparkline: [63.5, 65.15] },
        { symbol: "TEAM", name: "Atlassian Corp.", price: 185.30, change: -1.75, high: 191.00, low: 183.20, volume: "3.2M", sparkline: [188.5, 185.3] },
        { symbol: "WDAY", name: "Workday Inc.", price: 262.40, change: 0.15, high: 265.80, low: 259.10, volume: "2.5M", sparkline: [261.9, 262.4] },
        { symbol: "OKTA", name: "Okta Inc.", price: 92.40, change: -1.18, high: 95.20, low: 91.00, volume: "3.4M", sparkline: [93.5, 92.4] },
        { symbol: "SPLK", name: "Splunk Inc.", price: 156.20, change: 0.05, high: 157.00, low: 155.80, volume: "1.5M", sparkline: [156.0, 156.2] },
        { symbol: "MRVL", name: "Marvell Technology", price: 68.15, change: 4.12, high: 69.80, low: 65.10, volume: "12.8M", sparkline: [65.4, 68.15] },
        { symbol: "CRWD", name: "CrowdStrike Holdings", price: 315.40, change: 5.82, high: 322.00, low: 308.50, volume: "6.5M", sparkline: [305.2, 315.4] },
        { symbol: "ALNY", name: "Alnylam Pharmaceuticals", price: 154.20, change: -0.45, high: 156.80, low: 152.10, volume: "1.2M", sparkline: [155.0, 154.2] },
        { symbol: "GILD", name: "Gilead Sciences Inc.", price: 66.80, change: 0.25, high: 67.50, low: 65.90, volume: "7.4M", sparkline: [66.5, 66.8] },
        { symbol: "SIRI", name: "Sirius XM Holdings", price: 3.85, change: -1.12, high: 3.98, low: 3.75, volume: "21.2M", sparkline: [3.92, 3.85] }
      ];
      setMarketCrypto(mockC);
      setMarketStocks(mockS);
    } finally {
      setIsLoadingMarkets(false);
    }
  };

  useEffect(() => {
    const isMobileViewport = window.matchMedia("(max-width: 767px)").matches;
    const refreshMs = isMobileViewport ? 60000 : 25000;
    loadMarketsData();
    const fetchInterval = setInterval(() => {
      if (!document.hidden) loadMarketsData();
    }, refreshMs);
    return () => clearInterval(fetchInterval);
  }, []);

  // Fluctuations
  useEffect(() => {
    const isMobileViewport = window.matchMedia("(max-width: 767px)").matches;
    const marketFlux = setInterval(() => {
      if (document.hidden) return;
      setMarketCrypto(prev =>
        prev.map(asset => {
          const delta = (Math.random() * 0.003 - 0.0015);
          const nextPrice = +(asset.price * (1 + delta)).toFixed(asset.price > 10 ? 2 : 4);
          const nextSpark = [...asset.sparkline.slice(1), nextPrice];
          return {
            ...asset,
            price: nextPrice,
            change: +(asset.change + delta * 100).toFixed(2),
            sparkline: nextSpark,
            high: nextPrice > asset.high ? nextPrice : asset.high,
            low: nextPrice < asset.low ? nextPrice : asset.low,
          };
        })
      );
    }, isMobileViewport ? 12000 : 4500);
    return () => clearInterval(marketFlux);
  }, []);

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
  }, [user.activeInvestments, user.copyTrades, user.email, user.isLoggedIn, currentSupabaseUserId]);

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

  // Traders catalog + announcements — both Supabase-backed. These use the
  // real Supabase-derived identity (from SessionContext), not the old
  // Firebase `user.isLoggedIn`/`user.isAdmin`, which are stale now that
  // auth runs through Clerk.
  const { traders, adminCreateTrader, adminUpdateTrader, adminDeleteTrader } = useTraders(
    supabase,
    authReady,
    currentUserIsAdmin,
    addNotification
  );
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
  const {
    activeInvestments,
    adminActiveInvestments,
    purchaseInvestment,
    claimInvestmentPayout,
    topUpInvestmentRpc
  } = useActiveInvestments(supabase, authReady, currentSupabaseUserId, currentUserIsAdmin);
  const { portfolio, buyAsset, sellAsset } = usePortfolio(supabase, authReady, currentSupabaseUserId);
  const {
    copyTrades,
    adminCopyTrades,
    startCopyTrade,
    cancelCopyTrade,
    claimCopyTradePayout: claimCopyTradePayoutRpc
  } = useCopyTrades(supabase, authReady, currentSupabaseUserId, currentUserIsAdmin);
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

  // A slow clock (60s) so investment & copy-trade progress/countdown keep
  // advancing during a long-open session without a refetch. 60s is far below
  // the churn threshold that caused bug #14 (that was a ~2s market tick).
  const [liveClock, setLiveClock] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setLiveClock(Date.now()), 60000);
    return () => clearInterval(id);
  }, []);

  // Copy trades: derive the time-varying fields (progress, remainingDays,
  // status) LIVE from start_timestamp/end_timestamp/now via
  // syncCopyTradeCountdowns — same frozen-stored-columns issue as investments
  // (bug #17). Money fields (amountInvested, roiPercent, expectedProfit,
  // totalReturn) are preserved as-is; this only re-derives display values.
  useEffect(() => {
    const derived = syncCopyTradeCountdowns(copyTrades, liveClock);
    setUser(prev => prev.isLoggedIn ? { ...prev, copyTrades: derived } : prev);
  }, [copyTrades, liveClock, user.isLoggedIn]);

  // Keep support tickets in sync with their Supabase source.
  useEffect(() => {
    setUser(prev => prev.isLoggedIn ? { ...prev, tickets: supabaseTickets } : prev);
  }, [supabaseTickets, user.isLoggedIn]);

  // Keep active investments in sync with their Supabase source — and derive the
  // time-varying fields (progress, accumulatedProfit, remainingDays, status)
  // LIVE from start_date/end_date/now via syncInvestmentCountdowns. The DB
  // stores those columns once at creation and never recomputes them (bug #17),
  // so without this they sit frozen at 0%/$0/full-duration. The stored money
  // fields (amount, roiPercent, expectedProfit, totalReturn) are the source of
  // truth and are preserved as-is — this only re-derives the display values.
  useEffect(() => {
    const derived = syncInvestmentCountdowns(activeInvestments, plans, liveClock);
    setUser(prev => prev.isLoggedIn ? { ...prev, activeInvestments: derived } : prev);
  }, [activeInvestments, plans, liveClock, user.isLoggedIn]);

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