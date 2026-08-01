import { useSession } from "./domains/SessionContext";
import { useAuditLog } from "./domains/AuditLogContext";
import { useSiteSettings } from "./domains/SiteSettingsContext";
import { useNotifications } from "./domains/NotificationsContext";
import { useAdminUsers } from "./domains/AdminUsersContext";
import { useWallet } from "./domains/WalletContext";
import { useMarkets } from "./domains/MarketsContext";
import { useInvestmentPlans } from "./domains/InvestmentPlansContext";
import { useTraders } from "./domains/TradersContext";
import { useTrading } from "./domains/TradingContext";
import { useAirdrops } from "./domains/AirdropsContext";
import { useKyc } from "./domains/KycContext";
import { useSupport } from "./domains/SupportContext";
import { useAnnouncements } from "./domains/AnnouncementsContext";

// Re-exported for AdminContentTab.tsx, which imports this from here.
export { DEFAULT_SITE_CONTENT } from "../services/settingsService";

/**
 * COMPATIBILITY SHIM — do not add anything to this.
 *
 * The old monolithic AppContext has been split into the domain contexts under
 * `./domains/`. This hook reassembles their values into the single object the
 * pre-split call sites expect, so consumers can be migrated one file at a
 * time. It is not a provider: every domain provider is composed in
 * `AppProviders.tsx` and this just reads all of them.
 *
 * Migrating a consumer means replacing `useApp()` with only the domain hooks
 * that file actually uses — which is the entire point, since subscribing here
 * subscribes to everything. Once no file imports `useApp`, delete this file.
 */
export const useApp = () => {
  const { user } = useSession();
  const { adminAuditLogs } = useAuditLog();
  const { siteContent, updateSiteContent, appSettings, updateAppSettings } = useSiteSettings();
  const {
    notifications,
    unreadNotificationsCount,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
    addNotification,
    clearNotifications,
    sendWelcomeNotification
  } = useNotifications();
  const {
    usersDirectory,
    isLoadingUsersDirectory,
    refreshUsersDirectory,
    adminUpdateUserBalance,
    adminChangeUserStatus,
    adminResetUserPassword
  } = useAdminUsers();
  const {
    adminTransactions,
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
  const { executeTrade } = useTrading();
  const {
    airdrops,
    adminAirdropClaims,
    claimAirdrop,
    withdrawEarnings,
    adminApproveAirdrop,
    adminRejectAirdrop,
    adminCreateAirdrop,
    adminUpdateAirdrop,
    adminDeleteAirdrop
  } = useAirdrops();
  const { allKycSubmissions, submitKyc, adminKycReview } = useKyc();
  const {
    supportTickets,
    createTicket,
    replyToTicket,
    adminReplyToTicket,
    adminCloseTicket,
    adminSetTicketPriority
  } = useSupport();
  const {
    adminAnnouncements,
    userAnnouncements,
    adminCreateAnnouncement,
    adminUpdateAnnouncement,
    adminDeleteAnnouncement,
    markAnnouncementRead
  } = useAnnouncements();

  return {
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
  };
};
