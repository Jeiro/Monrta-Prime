import React, { useMemo } from "react";
import { CheckCircle, Clock3, Gift, XCircle } from "lucide-react";
import { useApp } from "../context/AppContext";
import {
  findUserCampaignClaim,
  getCampaignClaimCount,
  hasReachedClaimLimit,
  isAirdropActive,
} from "../services";
import { formatDate, formatDateTime } from "../lib/format";
import { Badge, Button, EmptyState, Progress, SectionCard } from "../components/ui";

const claimTone = (status: string) =>
  status === "Approved" ? "positive" : status === "Rejected" ? "negative" : "warning";

const ClaimIcon = ({ status }: { status: string }) => {
  if (status === "Approved") return <CheckCircle size={11} />;
  if (status === "Rejected") return <XCircle size={11} />;
  return <Clock3 size={11} />;
};

export const DashboardAirdrops: React.FC = () => {
  const { user, airdrops, adminAirdropClaims, claimAirdrop } = useApp();

  const activeCampaigns = useMemo(
    () =>
      airdrops.filter(
        (airdrop) => isAirdropActive(airdrop) && !hasReachedClaimLimit(airdrop, adminAirdropClaims)
      ),
    [airdrops, adminAirdropClaims]
  );

  const userClaims = useMemo(
    () =>
      adminAirdropClaims.filter(
        (claim) => claim.userEmail.toLowerCase() === (user.email || "").toLowerCase()
      ),
    [adminAirdropClaims, user.email]
  );

  const handleClaim = (airdropId: string) => {
    claimAirdrop(airdropId, "", "");
  };

  return (
    <div className="space-y-4 pb-4 sm:pb-6">
      <header className="flex flex-col justify-between gap-3 border-b border-line pb-5 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2.5">
            <Gift size={20} className="shrink-0 text-faint" aria-hidden="true" />
            <h1 className="text-2xl font-semibold tracking-tight text-ink">Airdrops</h1>
          </div>
          <p className="mt-1 text-xs text-muted">
            Reward campaigns you're eligible for, and the status of your claims.
          </p>
        </div>
        <Badge tone={activeCampaigns.length > 0 ? "accent" : "neutral"}>
          {activeCampaigns.length} active
        </Badge>
      </header>

      {userClaims.length > 0 && (
        <SectionCard title="Your claims">
          <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {userClaims.map((claim) => (
              <li
                key={claim.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-line bg-panel p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-ink">
                    {claim.campaignTitle ||
                      airdrops.find((item) => item.id === claim.airdropId)?.title ||
                      claim.token}
                  </p>
                  <p className="text-2xs text-muted">
                    <span className="font-data tabular-nums">{claim.rewardAmount}</span>{" "}
                    {claim.token} · {formatDateTime(claim.date)}
                  </p>
                </div>
                <Badge tone={claimTone(claim.status)}>
                  <ClaimIcon status={claim.status} /> {claim.status}
                </Badge>
              </li>
            ))}
          </ul>
        </SectionCard>
      )}

      {activeCampaigns.length === 0 ? (
        <SectionCard title="Campaigns">
          <EmptyState
            icon={Gift}
            title="No active campaigns"
            description="Approved campaigns appear here as soon as they open."
          />
        </SectionCard>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {activeCampaigns.map((airdrop) => {
            const claim = findUserCampaignClaim(adminAirdropClaims, user.email, airdrop.id);
            const claimCount = getCampaignClaimCount(adminAirdropClaims, airdrop.id);
            const limit = airdrop.claimLimit || 0;
            const progress = limit ? Math.min(100, Math.round((claimCount / limit) * 100)) : 0;

            return (
              <article
                key={airdrop.id}
                className="flex flex-col rounded-xl border border-line bg-surface p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className="grid h-10 w-10 place-items-center rounded-full border border-accent-line bg-accent-soft font-data text-sm font-semibold text-accent"
                    aria-hidden="true"
                  >
                    {airdrop.token[0]}
                  </span>
                  <Badge tone="positive">Live</Badge>
                </div>

                <h2 className="mt-3 text-base font-semibold text-ink">{airdrop.title}</h2>
                <p className="mt-1 min-h-8 text-xs leading-relaxed text-muted">
                  {airdrop.description || airdrop.eligibility}
                </p>

                <div className="mt-3 flex items-baseline justify-between gap-2">
                  <span className="text-xs text-muted">
                    <span className="font-data tabular-nums">{airdrop.rewardAmount}</span>{" "}
                    {airdrop.token.toUpperCase()}
                  </span>
                </div>

                <div className="mt-3 space-y-1.5">
                  <div className="flex justify-between text-2xs text-muted">
                    <span>Claims</span>
                    <span className="font-data tabular-nums">
                      {limit ? `${claimCount}/${limit}` : `${claimCount} submitted`}
                    </span>
                  </div>
                  <Progress value={limit ? progress : 0} label={`${airdrop.title} claims`} />
                </div>

                {/* Dates were printed straight from the record, so an ISO
                    string reached the UI whenever one was set. */}
                <dl className="mt-3 grid grid-cols-2 gap-2 text-2xs">
                  <div>
                    <dt className="text-faint">Starts</dt>
                    <dd className="text-ink">
                      {airdrop.startDate ? formatDate(airdrop.startDate) : "Open"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-faint">Ends</dt>
                    <dd className="text-ink">
                      {airdrop.endDate ? formatDate(airdrop.endDate) : "Open"}
                    </dd>
                  </div>
                </dl>

                <Button
                  block
                  className="mt-4"
                  disabled={!!claim}
                  variant={claim ? "secondary" : "primary"}
                  onClick={() => handleClaim(airdrop.id)}
                >
                  {claim ? `${claim.status}` : "Submit claim"}
                </Button>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
