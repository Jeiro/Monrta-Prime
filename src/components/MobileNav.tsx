import React from "react";
import { Home, Bell, Gift, Repeat, TrendingUp } from "lucide-react";
import { useApp } from "../context/AppContext";
import { useCurrentUser } from "../hooks/useCurrentUser";

interface MobileNavProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ currentView, onNavigate }) => {
  const { unreadNotificationsCount } = useApp();
  const { isLoggedIn, isAdmin } = useCurrentUser();
  if (!isLoggedIn || isAdmin) return null;
  const tabs = [
    { id: "home", label: "Home", icon: Home },
    { id: "dashboard-notifications", label: "Alerts", icon: Bell, badge: unreadNotificationsCount },
    { id: "dashboard-airdrops", label: "Airdrop", icon: Gift, isSpecial: true },
    { id: "dashboard-trading", label: "Trade", icon: Repeat },
    { id: "dashboard-plans", label: "Earn", icon: TrendingUp },
  ];

  const handleTabClick = (tabId: string) => {
    if (tabId === "home") {
      onNavigate(isLoggedIn ? "dashboard" : "home");
    } else {
      onNavigate(tabId);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 w-full z-50 bg-[#06080D]/98 backdrop-blur-md border-t border-line/60 shadow-[0_-8px_30px_rgba(0,0,0,0.35)] md:hidden pb-safe">
      <div className="grid grid-cols-5 items-center justify-items-center py-2 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = (tab.id === 'home' && (currentView === 'home' || currentView === 'dashboard')) || currentView === tab.id;
          
          return (
            <button
              key={tab.id}
              type="button"
              aria-label={tab.label}
              aria-current={isActive ? "page" : undefined}
              onClick={() => handleTabClick(tab.id)}
              className={`flex flex-col items-center gap-1 cursor-pointer rounded-2xl px-2 py-2 transition-colors duration-150 ${
                isActive ? "text-accent bg-accent/10 shadow-sm" : "text-muted hover:text-ink"
              }`}
            >
              <div className={`p-1.5 rounded-full ${tab.isSpecial ? "bg-accent/20 text-accent" : isActive ? "bg-white/10" : "bg-transparent"}`}>
                <Icon size={18} />
              </div>
              <span className="text-2xs font-medium tracking-wide">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};