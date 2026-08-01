import React, { useEffect, useCallback, useState, Suspense, lazy } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { AppProviders } from "./context/AppProviders";
import { Navigation } from "./components/Navigation";
import { MobileNav } from "./components/MobileNav";
import { Footer } from "./components/Footer";
import { ScrollAnimatedBackground } from "./components/ScrollAnimatedBackground";
import { TawkChat } from "./components/TawkChat";
import { GlobalModals } from "./components/GlobalModals";
import { RouteTransition } from "./components/RouteTransition";

import { useUser, AuthenticateWithRedirectCallback } from "@clerk/clerk-react";
import { useSupabaseClient, ensureUserRow } from "./lib/supabase";
import { useCurrentUser } from "./hooks/useCurrentUser";

// Pages (Lazy Loaded)
const PublicHome = lazy(() => import("./pages/PublicHome").then(m => ({ default: m.PublicHome })));
const PublicMarkets = lazy(() => import("./pages/PublicMarkets").then(m => ({ default: m.PublicMarkets })));
const PublicCopyTrading = lazy(() => import("./pages/PublicCopyTrading").then(m => ({ default: m.PublicCopyTrading })));
const PublicPlans = lazy(() => import("./pages/PublicPlans").then(m => ({ default: m.PublicPlans })));
const AuthPage = lazy(() => import("./pages/AuthPage").then(m => ({ default: m.AuthPage })));
const TermsPage = lazy(() => import("./pages/TermsPage").then(m => ({ default: m.TermsPage })));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage").then(m => ({ default: m.PrivacyPage })));
const RiskDisclosurePage = lazy(() => import("./pages/RiskDisclosurePage").then(m => ({ default: m.RiskDisclosurePage })));
const MaintenancePage = lazy(() => import("./pages/MaintenancePage").then(m => ({ default: m.MaintenancePage })));

// Dashboard (Lazy Loaded)
const DashboardOverview = lazy(() => import("./pages/DashboardOverview").then(m => ({ default: m.DashboardOverview })));
const DashboardTrading = lazy(() => import("./pages/DashboardTrading").then(m => ({ default: m.DashboardTrading })));
const DashboardPortfolio = lazy(() => import("./pages/DashboardPortfolio").then(m => ({ default: m.DashboardPortfolio })));
const DashboardPlans = lazy(() => import("./pages/DashboardPlans").then(m => ({ default: m.DashboardPlans })));
const DashboardWallet = lazy(() => import("./pages/DashboardWallet").then(m => ({ default: m.DashboardWallet })));
const DashboardSupport = lazy(() => import("./pages/DashboardSupport").then(m => ({ default: m.DashboardSupport })));
const DashboardAdmin = lazy(() => import("./pages/DashboardAdmin").then(m => ({ default: m.DashboardAdmin })));
const DashboardTransactions = lazy(() => import("./pages/DashboardTransactions").then(m => ({ default: m.DashboardTransactions })));
const DashboardAirdrops = lazy(() => import("./pages/DashboardAirdrops").then(m => ({ default: m.DashboardAirdrops })));
const DashboardKYC = lazy(() => import("./pages/DashboardKYC").then(m => ({ default: m.DashboardKYC })));
const DashboardWalletFeedback = lazy(() => import("./pages/DashboardWalletFeedback").then(m => ({ default: m.DashboardWalletFeedback })));
const DashboardNotifications = lazy(() => import("./pages/DashboardNotifications").then(m => ({ default: m.DashboardNotifications })));

// Components throughout the app still navigate with the pre-router view
// strings ("dashboard-wallet", "home#about-us", ...) — this maps them onto
// real URLs so those 90+ call sites didn't have to change.
const VIEW_TO_PATH: Record<string, string> = {
  home: "/",
  contact: "/#contact",
  "about-us": "/#about-us",
  markets: "/markets",
  "copy-trading": "/copy-trading",
  plans: "/plans",
  auth: "/auth",
  login: "/login",
  register: "/register",
  terms: "/terms",
  privacy: "/privacy",
  risk: "/risk",
  dashboard: "/dashboard",
  "dashboard-trading": "/dashboard/trading",
  "dashboard-portfolio": "/dashboard/portfolio",
  "dashboard-plans": "/dashboard/plans",
  "dashboard-wallet": "/dashboard/wallet",
  "dashboard-support": "/dashboard/support",
  "dashboard-transactions": "/dashboard/transactions",
  "dashboard-airdrops": "/dashboard/airdrops",
  "dashboard-kyc": "/dashboard/kyc",
  "dashboard-wallet-feedback": "/dashboard/wallet-feedback",
  "dashboard-notifications": "/dashboard/notifications",
  "dashboard-admin": "/admin",
};

// Reverse map, used to hand Navigation/MobileNav the view string their
// active-link highlighting still expects.
const PATH_TO_VIEW: Record<string, string> = Object.fromEntries(
  Object.entries(VIEW_TO_PATH)
    .filter(([, path]) => !path.includes("#"))
    .map(([view, path]) => [path, view])
);

// Deep links from the pre-router era used hashes (/#markets, /#/admin) —
// rewrite them onto real paths. #about-us / #contact stay as-is: they're
// genuine scroll anchors on the home page.
const LEGACY_HASH_TO_PATH: Record<string, string> = {
  "#home": "/", "#/home": "/",
  "#markets": "/markets", "#/markets": "/markets",
  "#plans": "/plans", "#/plans": "/plans",
  "#copy-trading": "/copy-trading", "#/copy-trading": "/copy-trading",
  "#auth": "/auth", "#/auth": "/auth",
  "#login": "/login", "#/login": "/login",
  "#register": "/register", "#/register": "/register",
  "#admin": "/admin", "#/admin": "/admin",
};

const WALLET_TABS = ["deposit", "withdraw", "ledger"] as const;
type WalletTab = (typeof WALLET_TABS)[number];
type NavigateFn = (view: string, assetSymbol?: string, subTab?: WalletTab) => void;

// The animated background is purely decorative, but third-party scripts
// (Tawk, browser extensions) sometimes move/remove its DOM nodes, which
// makes React's own removeChild throw during commits and — without a
// boundary — unmount the whole app. If it crashes, just drop it.
class DecorativeErrorBoundary extends React.Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

// Route-level fallback. Deliberately understated: a large spinner in the
// middle of an empty page makes a 200ms chunk fetch feel like a stall.
// aria-busy + a polite live region so the wait is announced rather than
// being silence for a screen reader.
const RouteSpinner = () => (
  <div
    className="flex h-[60vh] items-center justify-center"
    role="status"
    aria-busy="true"
    aria-live="polite"
  >
    <div className="h-6 w-6 animate-spin rounded-full border-2 border-line border-t-accent" />
    <span className="sr-only">Loading…</span>
  </div>
);

function TradingRoute({ onNavigate }: { onNavigate: NavigateFn }) {
  const [searchParams] = useSearchParams();
  const asset = searchParams.get("asset") || undefined;
  return <DashboardTrading key={asset || "default"} initialAsset={asset} onNavigate={onNavigate} />;
}

function WalletRoute() {
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get("tab") || "";
  // Support moved to its own page (/dashboard/support) — redirect old
  // ?tab=support deep links (notifications, bookmarks) there.
  if (tabParam === "support") {
    return <Navigate to="/dashboard/support" replace />;
  }
  const tab: WalletTab = (WALLET_TABS as readonly string[]).includes(tabParam)
    ? (tabParam as WalletTab)
    : "deposit";
  return <DashboardWallet key={tab} initialOpenTab={tab} />;
}

function AppShell() {
  // Identity & role come entirely from Clerk (signed-in state) + Supabase
  // (role) — the single source of truth for the route guards below.
  const { isLoggedIn, isAdmin, isReady } = useCurrentUser();
  const navigate = useNavigate();
  const location = useLocation();
  const localDev = import.meta.env.VITE_LOCAL_DEV === "true";
  const maintenanceMode = !localDev && import.meta.env.VITE_MAINTENANCE_MODE === "true";

  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);

  // Syncs the signed-in Clerk user into the Supabase `users` table
  const supabase = useSupabaseClient();
  const { user: clerkUser, isSignedIn } = useUser();

  useEffect(() => {
    if (isSignedIn && clerkUser) {
      ensureUserRow(supabase, clerkUser);
    }
  }, [isSignedIn, clerkUser?.id]);

  // Rewrite legacy hash deep-links onto real routes.
  useEffect(() => {
    const legacyPath = LEGACY_HASH_TO_PATH[location.hash];
    if (location.pathname === "/" && legacyPath && legacyPath !== "/") {
      navigate(legacyPath, { replace: true });
    }
  }, [location.pathname, location.hash, navigate]);

  // Scroll to the anchor when a hash is present (retrying briefly while the
  // lazy page chunk mounts), otherwise reset to the top on every navigation.
  useEffect(() => {
    const hash = location.hash;
    if (hash && !LEGACY_HASH_TO_PATH[hash]) {
      let attempts = 0;
      const timer = window.setInterval(() => {
        const el = document.getElementById(hash.slice(1));
        attempts += 1;
        if (el) el.scrollIntoView({ behavior: "smooth" });
        if (el || attempts >= 20) window.clearInterval(timer);
      }, 100);
      return () => window.clearInterval(timer);
    }
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
  }, [location.key]);

  const handleNavigate = useCallback<NavigateFn>((view, assetSymbol, subTab) => {
    if (isReady && isLoggedIn && isAdmin) {
      navigate("/admin");
      return;
    }

    if (view.includes("#")) {
      const anchor = view.split("#")[1];
      navigate(anchor ? `/#${anchor}` : "/");
      return;
    }

    if (view === "dashboard-settings") {
      navigate("/dashboard/wallet?tab=deposit");
      return;
    }
    if (view === "dashboard-referral") {
      navigate("/dashboard");
      return;
    }
    if (view === "dashboard-trading" && assetSymbol) {
      navigate(`/dashboard/trading?asset=${encodeURIComponent(assetSymbol)}`);
      return;
    }
    if (view === "dashboard-wallet" && subTab) {
      navigate(`/dashboard/wallet?tab=${subTab}`);
      return;
    }

    navigate(VIEW_TO_PATH[view] ?? "/");
  }, [navigate, isReady, isLoggedIn, isAdmin]);

  if (maintenanceMode) {
    return (
      <div className="relative flex min-h-screen flex-col bg-ground text-[#F5F6F8] font-sans">
        <DecorativeErrorBoundary>
        <ScrollAnimatedBackground />
      </DecorativeErrorBoundary>
        <main className="relative z-10 flex-1 w-full">
          <Suspense fallback={<RouteSpinner />}>
            <MaintenancePage />
          </Suspense>
        </main>
      </div>
    );
  }

  // Hold rendering until Clerk's session AND the Supabase role are both
  // known. This is the fix for the refresh flash: without it, a signed-in
  // user briefly saw the public home page (and an admin additionally
  // flashed through the user dashboard) before the redirect effects fired.
  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ground">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-accent"></div>
      </div>
    );
  }

  const isAdminUser = isLoggedIn && isAdmin;
  const isAuthenticatedUser = isLoggedIn && !isAdmin;

  // Admins only ever see the admin dashboard (pre-router behavior, kept).
  if (isAdminUser && location.pathname !== "/admin") {
    return <Navigate to="/admin" replace />;
  }

  const currentView = PATH_TO_VIEW[location.pathname] ?? "home";
  const showUserNavigation = !isAdminUser;
  const showUserMobileNav = isAuthenticatedUser && currentView !== "auth";

  const guestOnly = (element: React.ReactElement) =>
    isLoggedIn ? <Navigate to="/dashboard" replace /> : element;
  const userOnly = (element: React.ReactElement) =>
    isLoggedIn ? element : <Navigate to="/auth" replace />;

  const dashboardOverview = (
    <DashboardOverview
      onNavigate={handleNavigate}
      onOpenDeposit={() => setDepositModalOpen(true)}
      onOpenWithdraw={() => setWithdrawModalOpen(true)}
    />
  );

  return (
    <div className={`relative flex min-h-screen flex-col bg-ground text-ink font-sans ${showUserNavigation ? "pt-16 sm:pt-20" : ""}`}>
      <DecorativeErrorBoundary>
        <ScrollAnimatedBackground />
      </DecorativeErrorBoundary>

      {/* Dynamic top bar links */}
      {showUserNavigation && <Navigation currentView={currentView} onNavigate={handleNavigate} />}

      {/* Primary content area container */}
      <main className={`relative z-10 flex-1 w-full ${
        isAdminUser
          ? ""
          : currentView === "home"
            ? "pb-24 sm:pb-28"
            : "max-w-7xl mx-auto px-3 sm:px-5 lg:px-6 mt-2 pb-20 sm:pb-24"
      }`}>
        <Suspense fallback={<RouteSpinner />}>
          <RouteTransition routeKey={location.pathname}>
          <Routes>
            <Route path="/" element={guestOnly(<PublicHome onNavigate={handleNavigate} />)} />
            <Route path="/markets" element={guestOnly(<PublicMarkets onNavigate={handleNavigate} />)} />
            <Route path="/plans" element={guestOnly(<PublicPlans onNavigate={handleNavigate} />)} />
            <Route path="/copy-trading" element={<PublicCopyTrading onNavigate={handleNavigate} />} />
            <Route path="/auth" element={guestOnly(<AuthPage onNavigate={handleNavigate} />)} />
            <Route path="/login" element={guestOnly(<AuthPage onNavigate={handleNavigate} initialTab="login" />)} />
            <Route path="/register" element={guestOnly(<AuthPage onNavigate={handleNavigate} initialTab="register" />)} />
            <Route path="/terms" element={<TermsPage onNavigate={handleNavigate} />} />
            <Route path="/privacy" element={<PrivacyPage onNavigate={handleNavigate} />} />
            <Route path="/risk" element={<RiskDisclosurePage onNavigate={handleNavigate} />} />

            <Route path="/dashboard" element={userOnly(dashboardOverview)} />
            <Route path="/dashboard/trading" element={userOnly(<TradingRoute onNavigate={handleNavigate} />)} />
            <Route path="/dashboard/portfolio" element={userOnly(<DashboardPortfolio onNavigate={handleNavigate} />)} />
            <Route path="/dashboard/plans" element={userOnly(<DashboardPlans />)} />
            <Route path="/dashboard/wallet" element={userOnly(<WalletRoute />)} />
            <Route path="/dashboard/support" element={userOnly(<DashboardSupport />)} />
            <Route path="/dashboard/transactions" element={userOnly(<DashboardTransactions />)} />
            <Route path="/dashboard/airdrops" element={userOnly(<DashboardAirdrops />)} />
            <Route path="/dashboard/kyc" element={userOnly(<DashboardKYC />)} />
            <Route path="/dashboard/wallet-feedback" element={userOnly(<DashboardWalletFeedback />)} />
            <Route path="/dashboard/notifications" element={userOnly(<DashboardNotifications onNavigate={handleNavigate} />)} />

            <Route
              path="/admin"
              element={
                !isLoggedIn
                  ? <Navigate to="/auth" replace />
                  : isAdmin
                    ? <DashboardAdmin />
                    : <Navigate to="/dashboard" replace />
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </RouteTransition>
        </Suspense>
      </main>

      {/* Global Standard Footer - Hidden on mobile */}
      {!isAdminUser && currentView !== "auth" && (
        <div className="hidden sm:block">
          <Footer onNavigate={handleNavigate} />
        </div>
      )}

      {/* Mobile Sticky Navigation (Logged in users only) */}
      {showUserMobileNav && (
        <div className="sm:hidden mt-auto z-40 relative">
          <MobileNav currentView={currentView} onNavigate={handleNavigate} />
        </div>
      )}

      {/* Tawk.to Live Chat integration overlay fixed */}
      <TawkChat />

      <GlobalModals
        depositModalOpen={depositModalOpen}
        setDepositModalOpen={setDepositModalOpen}
        withdrawModalOpen={withdrawModalOpen}
        setWithdrawModalOpen={setWithdrawModalOpen}
        onNavigate={handleNavigate}
      />
    </div>
  );
}

export default function App() {
  // Google sign-in redirects here to complete the OAuth handshake.
  // Handled before anything else, outside the router.
  if (window.location.pathname === "/sso-callback") {
    return (
      <AuthenticateWithRedirectCallback
        afterSignInUrl="/"
        afterSignUpUrl="/"
      />
    );
  }

  return (
    <AppProviders>
      <AppShell />
    </AppProviders>
  );
}
