import React, { useState } from "react";
import { Share2, Users, Trophy, DollarSign, Copy, Check } from "lucide-react";
import { useSession } from "../context/domains/SessionContext";
import { useAirdrops } from "../context/domains/AirdropsContext";
import { useNotifications } from "../context/domains/NotificationsContext";

export const DashboardReferral: React.FC = () => {
  const { user } = useSession();
  const { withdrawEarnings } = useAirdrops();
  const { addNotification } = useNotifications();
  const [copied, setCopied] = useState(false);

  // Was hardcoded to https://orbitriotrades.com — the pre-rebrand domain, so
  // every referral link handed out pointed at a site that is no longer this
  // product. Deriving it from the current origin is also the only version
  // that stays correct across local, preview and production without another
  // constant to forget.
  const referralOrigin = typeof window !== "undefined" ? window.location.origin : "";
  const referralLink = `${referralOrigin}/register?ref=${user.email?.split("@")[0] || "user"}`;
  
  const referralCount = user.referralCount || 0;
  const points = user.points || 0;
  const earnedBalance = points * 1;
  const progressPercent = Math.min((points / 100) * 100, 100);

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    addNotification("Referral link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4 pb-4 sm:pb-6 font-sans">
      <h2 className="text-xl font-bold font-heading text-ink flex items-center gap-2">
        <Share2 className="text-accent" size={24} />
        Refer & Earn
      </h2>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface border border-line rounded-xl p-4 flex flex-col items-center">
          <Users className="text-muted mb-1.5" size={20} />
          <p className="text-sm font-bold text-ink font-data">{referralCount}</p>
          <p className="text-2xs text-muted mt-0.5">Referrals</p>
        </div>
        <div className="bg-surface border border-line rounded-xl p-4 flex flex-col items-center">
          <Trophy className="text-accent mb-1.5" size={20} />
          <p className="text-sm font-bold text-ink font-data">{points}</p>
          <p className="text-2xs text-muted mt-0.5">Points</p>
        </div>
        <div className="bg-surface border border-line rounded-xl p-4 flex flex-col items-center">
          <DollarSign className="text-positive mb-1.5" size={20} />
          <p className="text-sm font-bold text-ink font-data">${earnedBalance.toFixed(2)}</p>
          <p className="text-2xs text-muted mt-0.5">Balance</p>
        </div>
      </div>

      {/* Referral Link Container */}
      <div className="bg-surface border border-line rounded-xl p-4 space-y-2">
        <p className="text-xs text-muted font-bold">Your Referral Link:</p>
        <div className="bg-ground border border-line rounded-lg p-3 flex justify-between items-center text-sm text-muted gap-2">
          <span className="truncate font-mono text-xs">{referralLink}</span>
          <button 
            onClick={handleCopy} 
            className="bg-accent text-ground px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 text-xs shrink-0 cursor-pointer hover:opacity-90 transition-colors"
          >
            {copied ? <Check size={14}/> : <Copy size={14}/>}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>

      {/* Milestone Progress */}
      <div className="bg-surface border border-line rounded-xl p-4 space-y-3">
        <div className="flex justify-between text-2xs text-muted">
          <span>Payout Threshold</span>
          <span className="font-data font-bold">{points} / 100 Points</span>
        </div>
        <div className="w-full bg-line/50 h-2 rounded-full overflow-hidden">
          <div className="bg-accent h-2 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
        </div>
        
        <button 
          onClick={withdrawEarnings}
          disabled={points < 100}
          className={`w-full text-xs font-bold py-3 rounded-lg transition-all cursor-pointer ${
            points < 100 
              ? "bg-line/50 text-muted cursor-not-allowed border border-line" 
              : "bg-accent text-ground hover:opacity-90 shadow-sm shadow-accent/20"
          }`}
        >
          {points < 100 ? "Withdraw to Wallet ($100 Min)" : `Withdraw $${earnedBalance.toFixed(2)} to Wallet`}
        </button>
      </div>
    </div>
  );
};
