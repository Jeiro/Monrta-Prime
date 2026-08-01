import React, { createContext, useContext } from "react";
import toast from "react-hot-toast";
import type { Airdrop, AirdropClaim } from "../../types";
import {
  buildAirdropClaim,
  findUserCampaignClaim,
  hasReachedClaimLimit,
  isAirdropActive
} from "../../services";
import { useAirdrops as useAirdropsData } from "../../hooks/data/useAirdrops";
import { useAirdropClaims } from "../../hooks/data/useAirdropClaims";
import { useSession } from "./SessionContext";
import { useAuditLogWriter } from "./AuditLogContext";
import { useNotifications } from "./NotificationsContext";
import { useAdminUsersData } from "./AdminUsersContext";
import { useWalletData } from "./WalletContext";

interface AirdropsContextType {
  airdrops: Airdrop[];
  adminAirdropClaims: AirdropClaim[];
  claimAirdrop: (airdropId: string, token: string, rewardAmount: string) => void;
  withdrawEarnings: () => void;
  adminApproveAirdrop: (claimId: string) => void;
  adminRejectAirdrop: (claimId: string) => void;
  adminCreateAirdrop: (airdrop: Omit<Airdrop, "id">) => void;
  adminUpdateAirdrop: (airdrop: Airdrop) => void;
  adminDeleteAirdrop: (airdropId: string) => void;
}

const AirdropsContext = createContext<AirdropsContextType | undefined>(undefined);

/**
 * Airdrop campaigns and their claims. Approving a claim credits a balance, so
 * this provider refreshes both the users directory and the transaction ledger
 * afterwards — hence it reads the low-level halves of AdminUsers and Wallet.
 */
export const AirdropsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    supabase,
    user,
    setUser,
    authReady,
    currentSupabaseUserId,
    currentUserIsAdmin,
    currentUserIsLoggedIn,
    refetchCurrentUserProfile
  } = useSession();
  const { handleLog } = useAuditLogWriter();
  const { addNotification, notifyAdmins, dispatchTransactionalEmail } = useNotifications();
  const { refreshUsersDirectory } = useAdminUsersData();
  const { refreshTransactions } = useWalletData();

  const {
    airdrops,
    createAirdropCampaign,
    updateAirdropCampaign,
    deleteAirdropCampaign
  } = useAirdropsData(supabase, authReady, currentUserIsLoggedIn);
  const {
    claims: adminAirdropClaims,
    submitClaim: submitAirdropClaimInDb,
    approveClaim: approveAirdropClaimInDb,
    rejectClaim: rejectAirdropClaimInDb
  } = useAirdropClaims(supabase, authReady, currentSupabaseUserId, currentUserIsAdmin);

  const adminApproveAirdrop = async (claimId: string) => {
    const claim = adminAirdropClaims.find(c => c.id === claimId);
    if (!claim || claim.status !== "Pending") {
      addNotification("This airdrop claim has already been reviewed.");
      return;
    }

    const campaign = airdrops.find(item => item.id === claim.airdropId);
    const reward = parseFloat(claim.rewardAmount) || 0;

    try {
      await approveAirdropClaimInDb(claimId);
    } catch (e) {
      console.error("Error approving airdrop claim:", e);
      addNotification("Airdrop approval failed. Please review the claim again.");
      return;
    }

    await Promise.all([refreshUsersDirectory(), refreshTransactions()]);
    if (user.email && user.email.toLowerCase() === claim.userEmail.toLowerCase()) {
      await refetchCurrentUserProfile();
    }

    handleLog("Airdrop Claim Approved", `Credited ${claim.userEmail} $${reward.toFixed(2)} for ${claim.token}.`, user.email || "admin", "success");
    addNotification(`Airdrop claim approved and $${reward.toFixed(2)} credited.`, { title: "Airdrop approved", type: "success", eventKey: `admin:airdrop:approved:${claimId}` });
    addNotification(`Your ${claim.token} airdrop claim was approved and $${reward.toFixed(2)} credited.`, { title: "Airdrop approved", type: "success", recipientEmail: claim.userEmail, eventKey: `airdrop:approved:${claimId}`, action: { label: "View airdrops", view: "dashboard-airdrops" } });
    dispatchTransactionalEmail(claim.userEmail, "AIRDROP_CLAIM_APPROVED", `airdrop:approved:${claimId}`, {
      name: claim.userName || claim.userEmail.split("@")[0],
      campaignTitle: claim.campaignTitle || campaign?.title,
      token: claim.token,
      rewardAmount: claim.rewardAmount,
      amount: reward,
      claimId,
      transactionId: `tx-airdrop-${claimId}`,
      status: "approved"
    });
  };

  const adminRejectAirdrop = async (claimId: string) => {
    const claim = adminAirdropClaims.find(c => c.id === claimId);
    if (!claim || claim.status !== "Pending") {
      addNotification("This airdrop claim has already been reviewed.");
      return;
    }

    const campaign = airdrops.find(item => item.id === claim.airdropId);

    try {
      await rejectAirdropClaimInDb(claimId, "Rejected by admin.");
    } catch (e) {
      console.error("Error rejecting airdrop claim:", e);
      return;
    }

    handleLog("Airdrop Claim Rejected", `Rejected claim ${claimId} for ${claim.userEmail}.`, user.email || "admin", "warning");
    addNotification(`Airdrop claim ${claimId} rejected.`, { title: "Airdrop rejected", type: "warning", eventKey: `admin:airdrop:rejected:${claimId}` });
    addNotification(`Your ${claim.token} airdrop claim was rejected.`, { title: "Airdrop rejected", type: "error", recipientEmail: claim.userEmail, eventKey: `airdrop:rejected:${claimId}`, action: { label: "View airdrops", view: "dashboard-airdrops" } });
    dispatchTransactionalEmail(claim.userEmail, "AIRDROP_CLAIM_REJECTED", `airdrop:rejected:${claimId}`, {
      name: claim.userName || claim.userEmail.split("@")[0],
      campaignTitle: claim.campaignTitle || campaign?.title,
      token: claim.token,
      rewardAmount: claim.rewardAmount,
      claimId,
      reason: "Rejected by admin.",
      status: "rejected"
    });
  };

  const adminCreateAirdrop = async (airdrop: Omit<Airdrop, "id">) => {
    try {
      const newAirdrop = await createAirdropCampaign(airdrop);
      handleLog("Airdrop Campaign Created", `Created campaign ${newAirdrop.title}.`, user.email || "admin", "success");
      addNotification("Airdrop campaign created successfully.");
    } catch (error) {
      console.error("Failed to create airdrop campaign:", error);
      addNotification("Failed to create airdrop campaign.");
    }
  };

  const adminUpdateAirdrop = async (airdrop: Airdrop) => {
    try {
      const updated = await updateAirdropCampaign(airdrop);
      handleLog("Airdrop Campaign Updated", `Updated campaign ${updated.title}.`, user.email || "admin", "warning");
      addNotification("Airdrop campaign updated successfully.");
    } catch (error) {
      console.error("Failed to update airdrop campaign:", error);
      addNotification("Failed to update airdrop campaign.");
    }
  };

  const adminDeleteAirdrop = async (airdropId: string) => {
    try {
      await deleteAirdropCampaign(airdropId);
      handleLog("Airdrop Campaign Deleted", `Deleted campaign ${airdropId}.`, user.email || "admin", "alert");
      addNotification("Airdrop campaign deleted successfully.");
    } catch (error) {
      console.error("Failed to delete airdrop campaign:", error);
      addNotification("Failed to delete airdrop campaign.");
    }
  };

  const claimAirdrop = async (airdropId: string, token?: string, rewardAmount?: string) => {
    if (!user.email || !currentSupabaseUserId) return;
    const campaign = airdrops.find(item => item.id === airdropId);
    if (!campaign) {
      addNotification("This airdrop campaign is no longer available.");
      return;
    }
    if (!isAirdropActive(campaign)) {
      addNotification("This airdrop campaign is not active.");
      return;
    }
    if (findUserCampaignClaim(adminAirdropClaims, user.email, airdropId)) {
      addNotification("You already submitted a claim for this campaign.");
      return;
    }
    if (hasReachedClaimLimit(campaign, adminAirdropClaims)) {
      addNotification("This airdrop campaign has reached its claim limit.");
      return;
    }

    const newClaim = buildAirdropClaim(
      user.email,
      airdropId,
      token || campaign.token,
      rewardAmount || campaign.rewardAmount,
      campaign.title,
      user.name
    );

    try {
      await submitAirdropClaimInDb(newClaim.id, currentSupabaseUserId, airdropId, newClaim.token, newClaim.rewardAmount, campaign.title);
    } catch (error) {
      console.error("Failed to submit airdrop claim:", error);
      toast.error("Airdrop claims are temporarily unavailable. Please try again later.");
      return;
    }
    addNotification("Your airdrop claim has been submitted for platform approval.", { title: "Airdrop claim submitted", type: "info", eventKey: `airdrop:submitted:${newClaim.id}`, action: { label: "View airdrops", view: "dashboard-airdrops" } });
    dispatchTransactionalEmail(user.email, "AIRDROP_CLAIM_SUBMITTED", `airdrop:submitted:${newClaim.id}`, { name: user.name, campaignTitle: campaign.title, token: newClaim.token, rewardAmount: newClaim.rewardAmount, claimId: newClaim.id, status: "pending" });
    notifyAdmins(`${user.email || "A user"} submitted an airdrop claim for ${newClaim.token}.`, { title: "Airdrop claim requires review", type: "warning", eventKey: `airdrop:review:${newClaim.id}`, action: { label: "Review airdrops", view: "dashboard-admin" } });
    toast.success("Airdrop claim submitted successfully");
  };

  const withdrawEarnings = () => {
    if (!user.points || user.points < 100) return;
    const usdAmount = user.points * 1;
    setUser(prev => ({
      ...prev,
      balance: prev.balance + usdAmount,
      points: 0
    }));
    addNotification(`Withdrew $${usdAmount.toFixed(2)} to wallet.`);
  };

  return (
    <AirdropsContext.Provider value={{
      airdrops,
      adminAirdropClaims,
      claimAirdrop,
      withdrawEarnings,
      adminApproveAirdrop,
      adminRejectAirdrop,
      adminCreateAirdrop,
      adminUpdateAirdrop,
      adminDeleteAirdrop
    }}>
      {children}
    </AirdropsContext.Provider>
  );
};

export const useAirdrops = () => {
  const context = useContext(AirdropsContext);
  if (context === undefined) {
    throw new Error("useAirdrops must be used inside an AirdropsProvider");
  }
  return context;
};
