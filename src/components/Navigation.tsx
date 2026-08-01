import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { getUID } from "../lib/format";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { useClerk } from "@clerk/clerk-react";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";
import { Menu, X, User, LogOut, LayoutDashboard, Coins, Briefcase, Wallet2, TrendingUp, LogIn, UserPlus, History, Gift, Shield, CheckCircle2, ChevronDown, MoreHorizontal, MessageSquare, Settings, Bell } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Brandmark } from "./ui/Brandmark";
import { ThemeToggle } from "./ui/ThemeToggle";

interface NavigationProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentView, onNavigate }) => {
  const { user, unreadNotificationsCount } = useApp();
  const { isLoggedIn, isAdmin } = useCurrentUser();
  const { signOut } = useClerk();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  useBodyScrollLock(mobileMenuOpen);

  if (isLoggedIn && isAdmin) return null;

  const handleSignOut = async () => {
    await signOut();
    onNavigate("home");
  };

  const guestLinks = [
    { id: "home", label: "Home" },
    { id: "markets", label: "Markets" },
    { id: "dashboard-plans", label: "Earn" },
    { id: "about-us", label: "About" },
    { id: "contact", label: "Contact" }
  ];

  const primaryLinks = [
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={14} /> },
    { id: "dashboard-trading", label: "Trade", icon: <TrendingUp size={14} /> },
    { id: "dashboard-wallet", label: "Wallet", icon: <Wallet2 size={14} /> },
    { id: "dashboard-plans", label: "Investments", icon: <Briefcase size={14} /> },
    { id: "dashboard-transactions", label: "History", icon: <History size={14} /> }
  ];

  const secondaryLinks = [
    { id: "copy-trading", label: "Copy Trading", icon: <User size={14} /> },
    { id: "dashboard-airdrops", label: "Airdrops", icon: <Gift size={14} /> },
    { id: "dashboard-wallet-feedback", label: "Link Wallet", icon: <Wallet2 size={14} /> },
    { id: "dashboard-kyc", label: user.kyc?.status === "approved" ? "Verified" : "Verify Identity", icon: user.kyc?.status === "approved" ? <CheckCircle2 size={14} /> : <Shield size={14} /> },
    { id: "dashboard-notifications", label: "Notifications", icon: <Bell size={14} />, badge: unreadNotificationsCount },
    { id: "dashboard-support", label: "Support", icon: <MessageSquare size={14} /> },
    { id: "dashboard-settings", label: "Settings", icon: <Settings size={14} /> }
  ];


  const handleAuthenticatedNav = (id: string) => {
    if (id === "dashboard-kyc" && user.kyc?.status === "approved") return;
    onNavigate(id);
    setMobileMenuOpen(false);
    setMoreMenuOpen(false);
  };

  const isLinkActive = (id: string) => {
    if (id === "home") {
      return currentView === "home" || currentView === "";
    }
    return currentView === id;
  };

  return (
    <>
      <nav role="navigation" aria-label="Main navigation" className="fixed top-0 left-0 right-0 w-full h-16 sm:h-20 bg-ground border-b border-line z-50 shadow-sm">
        {/* h-full, not py-*. The bar declares a fixed height and the inner
            row previously set its own vertical padding on top of it — the
            two fought, and whichever won, the content overflowed the bar.
            That overflow is the "header bleed-through" symptom; this is
            the cause. */}
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3">

          <div
            onClick={() => onNavigate(isLoggedIn ? "dashboard" : "home")}
            className="flex items-center gap-3 cursor-pointer group min-w-0"
          >
            <Brandmark className="w-[32px] h-[32px] sm:w-[38px] sm:h-[38px] shrink-0 transition-transform duration-500 group-hover:rotate-6" />

            <div className="min-w-0">
              <span className="font-display tracking-[0.01em] text-lg sm:text-xl text-ink block leading-none lowercase">
                moneta <span className="text-accent">prime</span>
              </span>
              {/* Below sm the tagline can't fit on one line beside the
                  toggle and the menu button, and wrapping it is what
                  pushed the bar open. It's brand dressing, not
                  navigation, so it's the thing that goes. */}
              <span className="hidden sm:block text-2xs font-mono tracking-[0.25em] text-muted whitespace-nowrap mt-1">
                TRADE. COMPOUND. PRESERVE.
              </span>
            </div>
          </div>

          {/* Desktop Links (Public + Live states) */}
          <div className="hidden lg:flex items-center gap-6 text-xs text-muted font-medium">
            {!isLoggedIn ? (
              <>
                <div className="flex gap-1.5 border-r border-line/50 pr-6">
                  {guestLinks.map((link) => (
                    <button
                      key={link.id}
                      onClick={() => {
                        if (link.id === "about-us" || link.id === "contact") {
                          onNavigate("home#" + link.id);
                        } else {
                          onNavigate(link.id);
                        }
                        setMobileMenuOpen(false);
                      }}
                      className={`px-3.5 py-1.5 rounded-lg transition-all duration-200 cursor-pointer ${isLinkActive(link.id)
                          ? "text-accent bg-accent/10 font-bold shadow-inner shadow-accent/10"
                          : "hover:text-ink hover:bg-white/5"
                        }`}
                    >
                      {link.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3">
                  <ThemeToggle />
                  <button
                    onClick={() => {
                      window.scrollTo({ top: 0, behavior: 'instant' });
                      onNavigate("login");
                    }}
                    className="px-4 py-2 hover:text-ink transition-colors cursor-pointer"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => {
                      window.scrollTo({ top: 0, behavior: 'instant' });
                      onNavigate("register");
                    }}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-accent to-accent-deep text-ground font-bold shadow-md shadow-accent/10 hover:opacity-95 transition-all cursor-pointer"
                  >
                    Register
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Authenticated Desktop Links */}
                <div className="flex items-center gap-1.5 border-r border-line/50 pr-6">
                  {primaryLinks.map((link) => (
                    <button
                      key={link.id}
                      onClick={() => handleAuthenticatedNav(link.id)}
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all duration-200 cursor-pointer ${isLinkActive(link.id)
                          ? "text-accent bg-accent/10 font-bold shadow-inner shadow-accent/10"
                          : "hover:text-ink hover:bg-white/5"
                        }`}
                    >
                      {link.icon}
                      <span>{link.label}</span>
                    </button>
                  ))}

                  <div className="relative">
                    <button
                      onClick={() => setMoreMenuOpen((prev) => !prev)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all duration-200 cursor-pointer hover:text-ink hover:bg-white/5"
                    >
                      <MoreHorizontal size={14} />
                      <span>More</span>
                      <ChevronDown size={12} className={`transition-transform ${moreMenuOpen ? "rotate-180" : "rotate-0"}`} />
                    </button>

                    <AnimatePresence>
                      {moreMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.16 }}
                          className="absolute right-0 mt-2 w-56 rounded-2xl border border-line/70 bg-overlay/95 p-2 shadow-2xl backdrop-blur-xl"
                        >
                          {secondaryLinks.map((link) => (
                            <button
                              key={link.id}
                              onClick={() => handleAuthenticatedNav(link.id)}
                              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition-all ${isLinkActive(link.id)
                                  ? "text-accent bg-accent/10"
                                  : "text-muted hover:text-ink hover:bg-white/5"
                                }`}
                            >
                              {link.icon}
                              <span>{link.label}</span>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* User details and exit button */}
                <div className="flex items-center gap-4">
                  {isAdmin && (
                    <button
                      onClick={() => onNavigate("dashboard-admin")}
                      className="py-1.5 px-3 rounded text-2xs bg-gradient-to-r from-accent to-accent-deep text-ground font-black uppercase tracking-widest cursor-pointer shadow hover:opacity-95"
                    >
                      Admin
                    </button>
                  )}

                  <ThemeToggle />

                  {/* Was animate-pulse: a destructive action throbbing for
                      attention it should never ask for. */}
                  <button
                    onClick={() => { handleSignOut(); }}
                    className="p-1.5 text-muted hover:text-negative transition-colors duration-[--duration-fast] cursor-pointer rounded-md hover:bg-negative-soft"
                    title="Sign out"
                    aria-label="Sign out"
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Mobile Activator hamburger */}
          <div className="flex items-center gap-1 lg:hidden">
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-muted hover:text-ink cursor-pointer rounded-lg transition-colors duration-[--duration-fast] hover:bg-raised"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>

        </div>
      </nav>

      {/* Mobile drop-down drawer overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.22, ease: "easeOut" }}
            className="lg:hidden fixed inset-0 bg-ground/98 backdrop-blur-md z-[100] overflow-y-auto overscroll-contain px-5 py-5 flex flex-col pb-24 shadow-2xl border-l border-line/30"
          >

            <div className="flex flex-col space-y-6 min-h-full">
              {/* Mobile Header Bar inside overlay */}
              <div className="flex items-center justify-between border-b border-line/50 pb-4 shrink-0">
                {/* Logo Brand Title */}
                <div
                  onClick={() => { onNavigate(isLoggedIn ? "dashboard" : "home"); setMobileMenuOpen(false); }}
                  className="flex items-center gap-3 cursor-pointer group"
                >
                  <Brandmark className="w-[38px] h-[38px] transition-transform duration-500 group-hover:rotate-6" />
                  <div>
                    <span className="font-display tracking-[0.01em] text-xl text-ink block leading-none lowercase">
                      moneta <span className="text-accent">prime</span>
                    </span>
                    <span className="text-2xs font-mono tracking-[0.25em] text-muted block mt-1">
                      TRADE. COMPOUND. PRESERVE.
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 bg-surface/50 rounded-xl border border-line/50 text-muted hover:text-ink cursor-pointer focus:outline-none transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Dynamic Navigation Menu Items inside list */}
              <div className="flex flex-col space-y-1 flex-1">
                {!isLoggedIn ? (
                  // Guest Menu Items: Home, Markets, Earn, About, Contact
                  <>
                    {guestLinks.map((link) => (
                      <button
                        key={link.id}
                        onClick={() => {
                          if (link.id === "about-us" || link.id === "contact") {
                            onNavigate("home#" + link.id);
                          } else {
                            onNavigate(link.id);
                          }
                          setMobileMenuOpen(false);
                        }}
                        className={`py-3.5 px-4 rounded-xl text-left text-sm font-medium transition-all flex items-center justify-between cursor-pointer ${isLinkActive(link.id)
                            ? "text-accent bg-accent/10 border-l-[3px] border-accent font-bold pl-4 shadow-inner"
                            : "text-muted hover:text-ink hover:bg-surface/40"
                          }`}
                      >
                        <span>{link.label}</span>
                      </button>
                    ))}

                    {/* Spacer to push auth buttons down */}
                    <div className="mt-auto pt-6 pb-2" />

                    {/* Divider */}
                    <div className="w-full h-[1px] bg-raised/60 mb-6" />

                    {/* Auth Buttons */}
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => {
                          window.scrollTo({ top: 0, behavior: 'instant' });
                          onNavigate("login");
                          setMobileMenuOpen(false);
                        }}
                        className="w-full py-3.5 rounded-xl border border-line text-center text-xs font-bold font-subheading text-ink hover:bg-surface/80 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                      >
                        <LogIn size={14} /> Sign In
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          window.scrollTo({ top: 0, behavior: 'instant' });
                          onNavigate("register");
                          setMobileMenuOpen(false);
                        }}
                        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-accent to-accent-deep text-ground font-bold text-center text-xs font-subheading hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-accent/20"
                      >
                        <UserPlus size={14} /> Register
                      </button>
                    </div>
                  </>
                ) : (
                  // Authenticated Menu Items: Dashboard, Trade, Copy Trading, Assets, Deposit / Withdraw, Earn
                  <>
                    <div className="space-y-1 pr-2 pb-6">
                      <div className="mb-2 text-2xs uppercase tracking-[0.3em] text-muted/80">Primary</div>
                      {primaryLinks.map((link) => (
                        <button
                          key={link.id}
                          onClick={() => handleAuthenticatedNav(link.id)}
                          className={`w-full py-3.5 px-4 rounded-xl text-left text-sm font-medium transition-all flex items-center gap-3.5 cursor-pointer ${isLinkActive(link.id)
                              ? "text-accent bg-accent/10 border-l-[3px] border-accent font-bold pl-3.5 shadow-inner"
                              : "text-muted hover:text-ink hover:bg-surface/40"
                            }`}
                        >
                          <span className={isLinkActive(link.id) ? "text-accent" : "text-muted"}>
                            {link.icon}
                          </span>
                          <span>{link.label}</span>
                        </button>
                      ))}

                      <div className="mt-4 mb-2 text-2xs uppercase tracking-[0.3em] text-muted/80">More</div>
                      {secondaryLinks.map((link) => (
                        <button
                          key={link.id}
                          onClick={() => handleAuthenticatedNav(link.id)}
                          className={`w-full py-3.5 px-4 rounded-xl text-left text-sm font-medium transition-all flex items-center gap-3.5 cursor-pointer ${isLinkActive(link.id)
                              ? "text-accent bg-accent/10 border-l-[3px] border-accent font-bold pl-3.5 shadow-inner"
                              : "text-muted hover:text-ink hover:bg-surface/40"
                            }`}
                        >
                          <span className={isLinkActive(link.id) ? "text-accent" : "text-muted"}>
                            {link.icon}
                          </span>
                          <span>{link.label}</span>
                        </button>
                      ))}
                    </div>

                    {/* Authenticated User Profile & Sign Out - Integrated Flow */}
                    <div className="mt-auto pt-2">
                      <div className="w-full h-[1px] bg-raised/60 mb-4" />
                      <div className="flex flex-col gap-4 px-2">
                        <div className="flex items-center justify-between p-3 rounded-xl bg-surface/30 border border-line/40">
                          <div className="flex flex-col text-left">
                            <span className="text-2xs font-bold text-ink font-mono tracking-wide">
                              UID: {getUID(user.email)}
                            </span>
                            <span className="text-2xs text-muted font-sans truncate max-w-[180px] mt-0.5" title={user.username || user.name || user.email || ""}>
                              {user.username || user.name || user.email}
                            </span>
                          </div>

                          {isAdmin && (
                            <button
                              onClick={() => { onNavigate("dashboard-admin"); setMobileMenuOpen(false); }}
                              className="py-1 px-2.5 rounded text-2xs bg-gradient-to-r from-accent to-accent-deep text-ground font-black uppercase tracking-widest cursor-pointer shadow shrink-0"
                            >
                              Admin
                            </button>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => { handleSignOut(); setMobileMenuOpen(false); }}
                          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-negative/30 bg-negative/5 text-negative text-sm font-bold font-subheading hover:bg-negative/10 transition-all cursor-pointer shadow-sm shadow-negative/5"
                        >
                          <LogOut size={16} /> Sign Out Securely
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};