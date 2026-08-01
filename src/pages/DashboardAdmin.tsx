import React, { useState } from "react";
import { useWallet } from "../context/domains/WalletContext";
import { useSupport } from "../context/domains/SupportContext";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { 
  Users, Layers, ArrowDownLeft, ArrowUpRight, Volume2, ShieldAlert,
  MessageSquare, UserCheck, PenTool, CreditCard, Award, Gift, ReceiptText, Settings, Wallet
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { AdminLayout } from "../components/admin/AdminLayout";

import { Suspense, lazy } from "react";

// Lazy loaded admin tabs to reduce bundle size
const AdminUsersTab = lazy(() => import("../components/admin/tabs/AdminUsersTab").then(m => ({ default: m.AdminUsersTab })));
const AdminInvestmentsTab = lazy(() => import("../components/admin/tabs/AdminInvestmentsTab").then(m => ({ default: m.AdminInvestmentsTab })));
const AdminDepositsTab = lazy(() => import("../components/admin/tabs/AdminDepositsTab").then(m => ({ default: m.AdminDepositsTab })));
const AdminWithdrawalsTab = lazy(() => import("../components/admin/tabs/AdminWithdrawalsTab").then(m => ({ default: m.AdminWithdrawalsTab })));
const AdminBulletinsTab = lazy(() => import("../components/admin/tabs/AdminBulletinsTab").then(m => ({ default: m.AdminBulletinsTab })));
const AdminSupportTab = lazy(() => import("../components/admin/tabs/AdminSupportTab").then(m => ({ default: m.AdminSupportTab })));
const AdminSecurityTab = lazy(() => import("../components/admin/tabs/AdminSecurityTab").then(m => ({ default: m.AdminSecurityTab })));
const AdminContentTab = lazy(() => import("../components/admin/tabs/AdminContentTab").then(m => ({ default: m.AdminContentTab })));
const AdminTradersTab = lazy(() => import("../components/admin/tabs/AdminTradersTab").then(m => ({ default: m.AdminTradersTab })));
const AdminAirdropsTab = lazy(() => import("../components/admin/tabs/AdminAirdropsTab").then(m => ({ default: m.AdminAirdropsTab })));
const AdminWalletsTab = lazy(() => import("../components/admin/tabs/AdminWalletsTab").then(m => ({ default: m.AdminWalletsTab })));
const AdminKycTab = lazy(() => import("../components/admin/tabs/AdminKycTab").then(m => ({ default: m.AdminKycTab })));
const AdminTransactionsTab = lazy(() => import("../components/admin/tabs/AdminTransactionsTab").then(m => ({ default: m.AdminTransactionsTab })));
const AdminSettingsTab = lazy(() => import("../components/admin/tabs/AdminSettingsTab").then(m => ({ default: m.AdminSettingsTab })));
const AdminWalletFeedbackTab = lazy(() => import("../components/admin/tabs/AdminWalletFeedbackTab").then(m => ({ default: m.AdminWalletFeedbackTab })));

export const DashboardAdmin: React.FC = () => {
  const { walletFeedback, adminTransactions } = useWallet();
  const { supportTickets } = useSupport();

  // Role-based admin authentication — backed by Clerk + Supabase.
  // isReady matters: until the Supabase role has resolved, isAdmin is false
  // simply because it is not known yet. Treating that as "denied" is what
  // made this page flash "Access Denied" before every admin load.
  const { isLoggedIn: userIsLoggedIn, isAdmin: userIsAdmin, isReady } = useCurrentUser();
  const isAdminAuthenticated = userIsLoggedIn && userIsAdmin;

  const [activeTab, setActiveTab] = useState<
    "users" | "investments" | "transactions" | "deposits" | "withdrawals" | "bulletins" | "support" | "security" | "content" | "settings" | "traders" | "airdrops" | "kyc" | "wallets" | "wallet-feedback"
  >("users");

  // Stats for sidebar badges — adminTransactions/supportTickets already
  // cover every user when the caller is an admin.
  const pendingDeposits = adminTransactions.filter(t => t.type === "deposit" && t.status === "pending").length;
  const pendingPayoutCount = adminTransactions.filter(t => t.type === "withdrawal" && t.status === "pending").length;
  const openTickets = supportTickets.filter(t => t.status === "open").length;
  const newWalletFeedbackCount = (walletFeedback || []).filter(fb => fb.status === "new").length;

  // Role still resolving — hold, don't accuse.
  if (!isReady) {
    return (
      <div className="min-h-screen bg-ground flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-line border-t-accent" />
      </div>
    );
  }

  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-screen bg-ground flex items-center justify-center font-sans">
        <div className="text-center space-y-4">
          <ShieldAlert size={48} className="text-negative mx-auto" />
          <h1 className="text-2xl font-bold text-ink font-heading">Access Denied</h1>
          <p className="text-muted">You do not have administrative privileges.</p>
          <button onClick={() => window.location.assign("/")} className="text-accent hover:underline font-bold text-sm">
            Return to Homepage
          </button>
        </div>
      </div>
    );
  }

  const renderActiveTabContent = () => {
    switch (activeTab) {
      case "users": return <AdminUsersTab />;
      case "investments": return <AdminInvestmentsTab />;
      case "transactions": return <AdminTransactionsTab />;
      case "content": return <AdminContentTab />;
      case "settings": return <AdminSettingsTab />;
      case "traders": return <AdminTradersTab />;
      case "airdrops": return <AdminAirdropsTab />;
      case "wallets": return <AdminWalletsTab />;
      case "kyc": return <AdminKycTab />;
      case "deposits": return <AdminDepositsTab />;
      case "withdrawals": return <AdminWithdrawalsTab />;
      case "bulletins": return <AdminBulletinsTab />;
      case "support": return <AdminSupportTab />;
      case "security": return <AdminSecurityTab />;
      case "wallet-feedback": return <AdminWalletFeedbackTab />;
      default: return <AdminUsersTab />;
    }
  };

  const renderActiveTab = () => (
    <Suspense fallback={
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-accent"></div>
      </div>
    }>
      {renderActiveTabContent()}
    </Suspense>
  );

  const navItems = [
    { id: "users", label: "All Users & Balances", icon: Users },
    { id: "investments", label: "Investment Plans", icon: Layers },
    { id: "transactions", label: "Financial Ledger", icon: ReceiptText },
    { id: "content", label: "Content Editor", icon: PenTool },
    { id: "settings", label: "Business Settings", icon: Settings },
    { id: "traders", label: "Traders List", icon: Award },
    { id: "airdrops", label: "Free Coin Claims (Airdrops)", icon: Gift },
    { id: "wallets", label: "Wallet Gateways", icon: CreditCard },
    { id: "kyc", label: "ID Verifications", icon: UserCheck },
    { id: "deposits", label: "Incoming Payments (Deposits)", icon: ArrowDownLeft, alert: pendingDeposits },
    { id: "withdrawals", label: "Payout Requests (Withdrawals)", icon: ArrowUpRight, alert: pendingPayoutCount },
    { id: "bulletins", label: "Announcements Panel", icon: Volume2 },
    { id: "support", label: "Ticket Helpdesk", icon: MessageSquare, alert: openTickets },
    { id: "wallet-feedback", label: "Wallet Feedback", icon: Wallet, alert: newWalletFeedbackCount },
    { id: "security", label: "Security & Audit Logs", icon: ShieldAlert }
  ];

  return (
    <AdminLayout activeTab={activeTab} navItems={navItems} onTabChange={(tabId) => setActiveTab(tabId as typeof activeTab)}>
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {renderActiveTab()}
        </motion.div>
      </AnimatePresence>
    </AdminLayout>
  );
};