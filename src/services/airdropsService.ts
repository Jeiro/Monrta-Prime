import { AirdropClaimStatuses, AirdropStatuses } from "../constants/statuses";
import type { Airdrop, AirdropClaim } from "../types";
import { timestampId, todayIsoDate } from "./utils";

export type AirdropCampaignInput = Omit<Airdrop, "id" | "createdAt" | "updatedAt"> & Partial<Pick<Airdrop, "id" | "createdAt" | "updatedAt">>;

const parseDateValue = (value?: string) => {
  if (!value) return null;
  const time = new Date(`${value}T00:00:00`).getTime();
  return Number.isNaN(time) ? null : time;
};

export const normalizeAirdrop = (airdrop: AirdropCampaignInput, fallbackId = timestampId("airdrop")): Airdrop => {
  const now = new Date().toISOString();
  const enabled = airdrop.enabled ?? (airdrop.status === AirdropStatuses.LIVE || airdrop.status === AirdropStatuses.ACTIVE);
  const status = enabled ? AirdropStatuses.ACTIVE : AirdropStatuses.DISABLED;

  return {
    ...airdrop,
    id: airdrop.id || fallbackId,
    title: airdrop.title.trim(),
    token: airdrop.token.trim().toUpperCase(),
    rewardAmount: airdrop.rewardAmount.trim(),
    status,
    enabled,
    claimLimit: airdrop.claimLimit && airdrop.claimLimit > 0 ? Math.floor(airdrop.claimLimit) : undefined,
    startDate: airdrop.startDate || todayIsoDate(),
    endDate: airdrop.endDate || "",
    eligibility: airdrop.eligibility?.trim() || "All verified Moneta Prime members",
    description: airdrop.description?.trim() || "",
    createdAt: airdrop.createdAt || now,
    updatedAt: now
  };
};

export const isAirdropActive = (airdrop: Airdrop, now = new Date()) => {
  if (airdrop.enabled === false || airdrop.status === AirdropStatuses.DISABLED || airdrop.status === AirdropStatuses.ENDED) return false;
  const today = new Date(now.toISOString().split("T")[0]).getTime();
  const starts = parseDateValue(airdrop.startDate);
  const ends = parseDateValue(airdrop.endDate);
  if (starts !== null && today < starts) return false;
  if (ends !== null && today > ends) return false;
  return true;
};

export const getCampaignClaimCount = (claims: AirdropClaim[], airdropId: string) =>
  claims.filter(claim => claim.airdropId === airdropId && claim.status !== AirdropClaimStatuses.REJECTED).length;

export const hasReachedClaimLimit = (airdrop: Airdrop, claims: AirdropClaim[]) =>
  typeof airdrop.claimLimit === "number" && getCampaignClaimCount(claims, airdrop.id) >= airdrop.claimLimit;

export const findUserCampaignClaim = (claims: AirdropClaim[], userEmail: string | null | undefined, airdropId: string) => {
  if (!userEmail) return undefined;
  return claims.find(claim =>
    claim.airdropId === airdropId &&
    claim.userEmail.toLowerCase() === userEmail.toLowerCase()
  );
};

export const buildAirdropClaim = (
  userEmail: string,
  airdropId: string,
  token: string,
  rewardAmount: string,
  campaignTitle?: string,
  userName?: string | null
): AirdropClaim => ({
  id: timestampId("claim"),
  userEmail,
  userName: userName || undefined,
  airdropId,
  campaignTitle,
  token,
  rewardAmount,
  status: AirdropClaimStatuses.PENDING,
  date: todayIsoDate()
});

export const buildAirdrop = (airdrop: Omit<Airdrop, "id">): Airdrop => normalizeAirdrop(airdrop);

