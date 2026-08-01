import React, { createContext, useContext } from "react";
import toast from "react-hot-toast";
import type { KycSubmission } from "../../types";
import { useKyc as useKycData } from "../../hooks/data/useKyc";
import { useSession } from "./SessionContext";
import { useAuditLogWriter } from "./AuditLogContext";
import { useNotifications } from "./NotificationsContext";
import { useAdminUsersData } from "./AdminUsersContext";

interface KycContextType {
  allKycSubmissions: Record<string, KycSubmission>;
  submitKyc: (kyc: KycSubmission) => Promise<void>;
  adminKycReview: (email: string, status: "approved" | "rejected", reason?: string) => Promise<void>;
}

const KycContext = createContext<KycContextType | undefined>(undefined);

/**
 * Identity verification. Both handlers write the reviewed submission back onto
 * `user.kyc` when the subject is the signed-in account — that field gates
 * withdrawals, so it has to stay live rather than wait for a refetch.
 */
export const KycProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { supabase, user, setUser, authReady, currentSupabaseUserId, currentUserIsAdmin } = useSession();
  const { handleLog } = useAuditLogWriter();
  const { addNotification, notifyAdmins, dispatchTransactionalEmail } = useNotifications();
  const { usersDirectory } = useAdminUsersData();

  const { allKycSubmissions, submitMyKyc, adminReviewKycByEmail } =
    useKycData(supabase, authReady, currentSupabaseUserId, currentUserIsAdmin);

  const adminKycReview = async (email: string, status: "approved" | "rejected", reason?: string): Promise<void> => {
    try {
      const targetProfile = usersDirectory.find(item => item.email.toLowerCase() === email.toLowerCase());
      if (!targetProfile?.id) throw new Error(`No Supabase user record found for ${email}.`);
      const notes = reason || (status === "approved" ? "Verified by admin." : "Documents not sufficient.");

      const reviewedKyc = await adminReviewKycByEmail(email, targetProfile.id, status, notes);

      if (user.email && user.email.toLowerCase() === email.toLowerCase()) {
        setUser(prev => ({ ...prev, kyc: reviewedKyc }));
      }
      handleLog("KYC Verification Result", `Verification team reviewed KYC for ${email}. Result: ${status}.`, user.email || "system", status === "approved" ? "success" : "alert");
      addNotification(`KYC verification for ${email} marked as ${status}.`, { title: `KYC ${status}`, type: status === "approved" ? "success" : "warning", eventKey: `admin:kyc:${status}:${email}` });
      addNotification(status === "approved" ? "Your KYC verification was approved." : "Your KYC verification was rejected. Please review the notes and resubmit.", { title: status === "approved" ? "KYC approved" : "KYC rejected", type: status === "approved" ? "success" : "error", recipientEmail: email, eventKey: `kyc:${status}:${email}:${reviewedKyc.reviewedAt || reviewedKyc.submissionDate}`, action: { label: "View KYC", view: "dashboard-kyc" } });
      dispatchTransactionalEmail(email, status === "approved" ? "KYC_APPROVED" : "KYC_REJECTED", `kyc:${status}:${email}:${reviewedKyc.reviewedAt || reviewedKyc.submissionDate}`, { name: targetProfile?.name || email.split("@")[0], documentType: reviewedKyc.documentType || reviewedKyc.idType, reason: reviewedKyc.rejectionReason || reason, status });
    } catch (e) {
      toast.error("Failed to update KYC review");
      throw e;
    }
  };

  const submitKyc = async (kyc: KycSubmission): Promise<void> => {
    if (!user.email) throw new Error("You must be signed in to submit KYC.");
    if (!currentSupabaseUserId) throw new Error("You must be signed in to submit KYC.");
    try {
      const submission = await submitMyKyc(currentSupabaseUserId, kyc);

      setUser(prev => ({ ...prev, kyc: submission }));
      addNotification("Your KYC submission has been received and is being reviewed.", { title: "KYC submitted", type: "info", eventKey: `kyc:submitted:${submission.submissionDate || user.email}`, action: { label: "View KYC", view: "dashboard-kyc" } });
      dispatchTransactionalEmail(user.email, "KYC_SUBMITTED", `kyc:submitted:${submission.submissionDate || user.email}`, { name: user.name, documentType: submission.documentType || submission.idType, status: "pending" });
      notifyAdmins(`${user.email} submitted KYC documents for review.`, { title: "KYC requires review", type: "warning", eventKey: `kyc:review:${user.email}:${submission.submissionDate || submission.idNumber}`, action: { label: "Review KYC", view: "dashboard-admin" } });
      toast.success("KYC documents submitted for review");
    } catch (e) {
      toast.error("Failed to submit KYC documents");
      throw e;
    }
  };

  return (
    <KycContext.Provider value={{ allKycSubmissions, submitKyc, adminKycReview }}>
      {children}
    </KycContext.Provider>
  );
};

export const useKyc = () => {
  const context = useContext(KycContext);
  if (context === undefined) {
    throw new Error("useKyc must be used inside a KycProvider");
  }
  return context;
};
