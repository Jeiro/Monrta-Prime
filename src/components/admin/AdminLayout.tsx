import React, { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Compass, Menu, ShieldAlert, X } from "lucide-react";
import { useClerk } from "@clerk/clerk-react";
import { useBodyScrollLock } from "../../hooks/useBodyScrollLock";

type AdminNavItem = {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  alert?: number;
};

interface AdminLayoutProps {
  activeTab: string;
  navItems: AdminNavItem[];
  onTabChange: (tabId: string) => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ activeTab, navItems, onTabChange, children }) => {
  const { signOut } = useClerk();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  useBodyScrollLock(isMobileMenuOpen);

  const handleLockAdminTerminal = async () => {
    await signOut();
    window.location.assign("/");
  };

  const renderNavItems = (closeOnSelect = false) => navItems.map(item => {
    const Icon = item.icon;
    const isActive = activeTab === item.id;

    return (
      <button
        key={item.id}
        onClick={() => {
          onTabChange(item.id);
          if (closeOnSelect) setIsMobileMenuOpen(false);
        }}
        className={`w-full flex items-center justify-between text-left py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-[38px] ${
          isActive ? "bg-accent text-ground shadow" : "text-muted hover:text-ink hover:bg-line/30"
        }`}
      >
        <span className="flex items-center gap-2.5">
          <Icon size={14} className={isActive ? "text-ground" : "text-accent"} />
          {item.label}
        </span>
        {!!item.alert && (
          <span className={`text-2xs font-black px-1.5 py-0.5 rounded-full ${isActive ? "bg-ground text-accent" : "bg-negative/15 text-negative border border-negative/30 animate-pulse"}`}>
            {item.alert}
          </span>
        )}
      </button>
    );
  });

  return (
    <div className="min-h-screen bg-ground font-sans pb-20">
      <header className="lg:hidden flex items-center justify-between p-4 bg-surface border-b border-line sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <ShieldAlert size={20} className="text-negative" />
          <span className="text-sm font-bold text-ink uppercase tracking-widest">Admin</span>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 bg-line/50 text-ink rounded-lg hover:bg-line transition-colors cursor-pointer"
        >
          <Menu size={20} />
        </button>
      </header>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="lg:hidden fixed inset-0 z-50 flex overscroll-contain"
          >
            <aside className="w-[85%] max-w-sm bg-surface border-r border-line h-full flex flex-col p-5 shadow-2xl relative overflow-y-auto">
              <div className="flex justify-between items-center mb-6 border-b border-line pb-4">
                <div className="flex items-center gap-3">
                  <span className="p-2 rounded-xl bg-gradient-to-tr from-accent-deep to-accent text-ground">
                    <Compass size={18} />
                  </span>
                  <div>
                    <h3 className="text-xs font-bold text-ink uppercase font-heading">
                      <span className="lowercase text-ink font-bold">moneta <span className="text-accent">prime</span></span> Node
                    </h3>
                    <span className="text-2xs bg-negative/10 border border-negative/30 text-negative py-0.5 px-2 font-bold rounded-full block w-fit mt-0.5">
                      MASTER ADMIN
                    </span>
                  </div>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 rounded-lg bg-surface border border-line text-ink hover:border-accent">
                  <X size={16} />
                </button>
              </div>

              <nav className="flex-grow space-y-1.5 overflow-y-auto pr-1">
                {renderNavItems(true)}
              </nav>

              <div className="pt-4 border-t border-line/50 text-center mt-4">
                <button
                  onClick={handleLockAdminTerminal}
                  className="w-full py-2.5 bg-line/80 text-negative font-bold text-xs uppercase rounded-xl hover:bg-line transition-all cursor-pointer min-h-[44px]"
                >
                  Lock Admin Terminal
                </button>
              </div>
            </aside>
            <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 relative overflow-visible">
        <aside className="hidden lg:flex lg:col-span-3 bg-surface border border-line rounded-2xl p-5 flex-col justify-between self-start sticky top-8">
          <div className="space-y-6">
            <div className="border-b border-line pb-4 flex items-center gap-3">
              <span className="p-2.5 rounded-xl bg-gradient-to-tr from-accent-deep to-accent text-ground shrink-0">
                <Compass size={20} />
              </span>
              <div>
                <h3 className="text-sm font-bold text-ink uppercase font-heading"><span className="lowercase text-ink font-bold">moneta <span className="text-accent">prime</span></span> Node</h3>
                <span className="text-2xs bg-negative/10 border border-negative/30 text-negative py-0.5 px-2.5 font-bold rounded-full block w-fit mt-1">
                  MASTER ADMIN
                </span>
              </div>
            </div>

            <nav className="space-y-1.5">
              {renderNavItems()}
            </nav>
          </div>

          <div className="pt-6 border-t border-line/50 mt-6 text-center">
            <button onClick={handleLockAdminTerminal} className="text-2xs uppercase font-bold text-center text-negative hover:underline tracking-wider cursor-pointer">
              Lock Admin Terminal
            </button>
          </div>
        </aside>

        <section className="col-span-1 lg:col-span-9 space-y-6 w-full relative">
          <div className="hidden lg:flex items-center justify-between bg-surface border border-line rounded-2xl px-5 py-4">
            <div>
              <p className="text-2xs uppercase tracking-[0.3em] text-muted font-bold">Secure Admin Terminal</p>
              <h1 className="text-lg font-bold text-ink font-heading mt-1">Control Center</h1>
            </div>
            <span className="text-2xs bg-negative/10 border border-negative/30 text-negative px-3 py-1 rounded-full font-bold uppercase tracking-wider">
              Admin Only
            </span>
          </div>
          {children}
        </section>
      </div>
    </div>
  );
};
