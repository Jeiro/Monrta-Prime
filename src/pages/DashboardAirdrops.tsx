import React, { useMemo } from "react";
import { CheckCircle, Clock3, Gift, Sparkles, XCircle } from "lucide-react";
import { useApp } from "../context/AppContext";
import { findUserCampaignClaim, getCampaignClaimCount, hasReachedClaimLimit, isAirdropActive } from "../services";

const claimBadgeClass = (status: string) => {
  if (status === "Approved") return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
  if (status === "Rejected") return "bg-red-500/10 text-red-400 border-red-500/30";
  return "bg-yellow-500/10 text-yellow-300 border-yellow-500/30";
};

const ClaimIcon = ({ status }: { status: string }) => {
  if (status === "Approved") return <CheckCircle size={12} />;
  if (status === "Rejected") return <XCircle size={12} />;
  return <Clock3 size={12} />;
};

export const DashboardAirdrops: React.FC = () => {
  const { user, airdrops, adminAirdropClaims, claimAirdrop } = useApp();

  const activeCampaigns = useMemo(() =>
    airdrops.filter(airdrop => isAirdropActive(airdrop) && !hasReachedClaimLimit(airdrop, adminAirdropClaims)),
    [airdrops, adminAirdropClaims]
  );

  const userClaims = useMemo(() =>
    adminAirdropClaims.filter(claim => claim.userEmail.toLowerCase() === (user.email || "").toLowerCase()),
    [adminAirdropClaims, user.email]
  );

  const handleClaim = (airdropId: string) => {
    claimAirdrop(airdropId, "", "");
  };

  return (
    <div className="space-y-5 pb-4 sm:pb-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-xl font-bold font-heading text-ink flex items-center gap-2">
          <Gift className="text-accent" size={24} />
          Airdrop Center
        </h2>
        <span className="text-2xs font-bold text-accent bg-accent/10 border border-accent/30 px-3 py-1 rounded-full flex items-center gap-1.5 w-fit">
          <Sparkles size={10} /> {activeCampaigns.length} Active
        </span>
      </div>

      {userClaims.length > 0 && (
        <div className="bg-surface border border-line rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-bold text-ink">My Claims</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {userClaims.map(claim => (
              <div key={claim.id} className="border border-line rounded-lg p-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-ink truncate">{claim.campaignTitle || airdrops.find(item => item.id === claim.airdropId)?.title || claim.token}</p>
                  <p className="text-2xs text-muted">{claim.rewardAmount} {claim.token} - {claim.date}</p>
                </div>
                <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-full border text-2xs font-bold ${claimBadgeClass(claim.status)}`}>
                  <ClaimIcon status={claim.status} /> {claim.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeCampaigns.length === 0 ? (
        <div className="bg-surface border border-line rounded-xl p-8 text-center">
          <Gift className="mx-auto text-muted mb-3" size={28} />
          <p className="text-sm font-bold text-ink">No active airdrop campaigns</p>
          <p className="text-xs text-muted mt-1">Approved campaigns will appear here when the platform opens them.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeCampaigns.map((airdrop) => {
            const claim = findUserCampaignClaim(adminAirdropClaims, user.email, airdrop.id);
            const claimCount = getCampaignClaimCount(adminAirdropClaims, airdrop.id);
            const limit = airdrop.claimLimit || 0;
            const progress = limit ? Math.min(100, Math.round((claimCount / limit) * 100)) : 0;
            const disabled = !!claim;

            return (
              <div key={airdrop.id} className="bg-surface border border-line rounded-xl p-4 space-y-4 hover:border-accent/30 transition-colors">
                <div className="flex justify-between items-center">
                  <div className="w-10 h-10 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center font-bold text-accent text-sm">
                    {airdrop.token[0]}
                  </div>
                  <span className="text-2xs bg-positive/10 text-positive font-bold px-2 py-0.5 rounded border border-positive/20">Live</span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-ink">{airdrop.title}</h3>
                  <p className="text-xs text-muted mt-1 min-h-8">{airdrop.description || airdrop.eligibility}</p>
                  <div className="flex items-end justify-between mt-3 gap-2">
                    <p className="text-sm text-muted">{airdrop.rewardAmount} {airdrop.token.toUpperCase()}</p>
                    <p className="text-base font-bold text-ink font-data">${airdrop.rewardAmount}</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-2xs text-muted">
                    <span>Claims</span>
                    <span>{limit ? `${claimCount}/${limit}` : `${claimCount} submitted`}</span>
                  </div>
                  <div className="w-full bg-line/50 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-accent h-1.5 rounded-full transition-all duration-500" style={{ width: `${limit ? progress : 16}%` }}></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-2xs text-muted">
                  <span>Starts: <span className="text-ink">{airdrop.startDate || "Open"}</span></span>
                  <span>Ends: <span className="text-ink">{airdrop.endDate || "Open"}</span></span>
                </div>

                <button
                  onClick={() => handleClaim(airdrop.id)}
                  disabled={disabled}
                  className={`w-full text-xs font-bold py-2.5 rounded-lg transition-all cursor-pointer ${
                    disabled
                      ? "bg-line/50 text-muted cursor-not-allowed border border-line"
                      : "bg-accent text-ground hover:opacity-90 shadow-sm shadow-accent/20"
                  }`}
                >
                  {claim ? `${claim.status} Claim` : "Submit Claim"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
