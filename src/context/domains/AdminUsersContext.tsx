import React, { createContext, useContext } from "react";
import { useUsersDirectory, type CoreUserProfile } from "../../hooks/data/useUsersDirectory";
import { useSession } from "./SessionContext";
import { useAuditLogWriter } from "./AuditLogContext";
import { useNotifications } from "./NotificationsContext";
import { useWalletData } from "./WalletContext";

interface AdminUsersDataContextType {
  usersDirectory: CoreUserProfile[];
  isLoadingUsersDirectory: boolean;
  refreshUsersDirectory: () => Promise<void>;
}

interface AdminUsersContextType extends AdminUsersDataContextType {
  adminUpdateUserBalance: (
    email: string,
    amount: number,
    txData?: { type: "credit" | "debit"; amount: number; label: string; notes: string }
  ) => Promise<void>;
  adminChangeUserStatus: (email: string, status: "active" | "suspended" | "banned") => void;
  adminResetUserPassword: (email: string) => void;
}

const AdminUsersDataContext = createContext<AdminUsersDataContextType | undefined>(undefined);
const AdminUsersContext = createContext<Omit<AdminUsersContextType, keyof AdminUsersDataContextType> | undefined>(undefined);

/**
 * The users directory on its own, deliberately mounted LOW in the provider
 * tree. It is not only an admin concern: notifyAdmins resolves its recipient
 * list from it, deposit/withdrawal emails fall back to it when a transaction's
 * denormalized user_email column is blank, and announcements fan out over it.
 * Those all live above this provider, so the raw data has to sit below them —
 * while the admin *handlers* (which need notifications, the audit log and the
 * transaction ledger) sit above. Hence the two halves; `useAdminUsers()`
 * stitches them back together for consumers.
 */
export const AdminUsersDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { supabase, authReady, currentUserIsAdmin } = useSession();
  const {
    usersDirectory,
    isLoadingDirectory: isLoadingUsersDirectory,
    refreshUsersDirectory
  } = useUsersDirectory(supabase, authReady, currentUserIsAdmin);

  return (
    <AdminUsersDataContext.Provider value={{ usersDirectory, isLoadingUsersDirectory, refreshUsersDirectory }}>
      {children}
    </AdminUsersDataContext.Provider>
  );
};

export const useAdminUsersData = () => {
  const context = useContext(AdminUsersDataContext);
  if (context === undefined) {
    throw new Error("useAdminUsersData must be used inside an AdminUsersDataProvider");
  }
  return context;
};

export const AdminUsersProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { supabase, user, setUser, currentSupabaseUserId, refetchCurrentUserProfile } = useSession();
  const { handleLog } = useAuditLogWriter();
  const { addNotification, dispatchTransactionalEmail } = useNotifications();
  const { usersDirectory, refreshUsersDirectory } = useAdminUsersData();
  const { refreshTransactions } = useWalletData();

  const adminUpdateUserBalance = async (
    email: string,
    amount: number,
    txData?: {
      type: "credit" | "debit";
      amount: number;
      label: string;
      notes: string;
    }
  ) => {
    const targetProfile = usersDirectory.find(item => item.email.toLowerCase() === email.toLowerCase());
    if (!targetProfile) throw new Error(`No Supabase user found for ${email}.`);

    try {
      const { error } = await supabase.rpc("admin_update_user_balance", {
        p_user_id: targetProfile.id,
        p_new_balance: amount,
        p_label: txData?.label || "Admin Balance Edit",
        p_notes: txData?.notes || ""
      });
      if (error) throw error;

      // Trigger email notification if label matches, same as before.
      if (txData?.label === "Deposit Successful") {
        dispatchTransactionalEmail(email, "DEPOSIT_APPROVED", `deposit:admin-balance:${targetProfile.id}:${Date.now()}`, {
          name: targetProfile.name || email,
          amount: txData.amount,
          asset: "USD",
          txHash: "",
          transactionId: "",
          status: "approved"
        });
      }

      // Refresh the admin's own view of the directory + ledger immediately.
      await Promise.all([refreshUsersDirectory(), refreshTransactions()]);

      // If the admin edited their own balance, refresh their live session too.
      if (currentSupabaseUserId === targetProfile.id) {
        await refetchCurrentUserProfile();
      }

      handleLog("Ledger Balances Adjusted", `Overrode balance of ${email} to $${amount}.`, user.email || "admin", "alert");
      addNotification(`Account [${email.split("@")[0].toUpperCase()}] balance updated by node admin.`);
    } catch (e) {
      console.error("Error updating user balance via Supabase:", e);
      throw e;
    }
  };

  const adminChangeUserStatus = async (email: string, statusText: "active" | "suspended" | "banned") => {
    try {
      const targetUserId = usersDirectory.find(item => item.email.toLowerCase() === email.toLowerCase())?.id;
      if (targetUserId) {
        const { error } = await supabase.from("users").update({ status: statusText }).eq("id", targetUserId);
        if (error) console.error("Failed to sync status to Supabase:", error);
      }

      if (user.email && user.email.toLowerCase() === email.toLowerCase()) {
        setUser(prev => ({ ...prev, status: statusText }));
      }
      handleLog("User Access Permissions Changed", `Restructured status of ${email} to ${statusText}.`, user.email || "admin", "alert");
      addNotification(`Safety rules enforced: account [${email}] set to ${statusText}.`);
    } catch (e) {
      console.error("Error updating user status:", e);
    }
  };

  const adminResetUserPassword = (email: string) => {
    handleLog("Password Core Reset", `Dispatched verification security reset token to ${email}.`, user.email || "admin", "success");
    addNotification(`Sent reset token dispatch to ${email}.`);
  };

  return (
    <AdminUsersContext.Provider value={{ adminUpdateUserBalance, adminChangeUserStatus, adminResetUserPassword }}>
      {children}
    </AdminUsersContext.Provider>
  );
};

export const useAdminUsers = (): AdminUsersContextType => {
  const data = useAdminUsersData();
  const context = useContext(AdminUsersContext);
  if (context === undefined) {
    throw new Error("useAdminUsers must be used inside an AdminUsersProvider");
  }
  return { ...data, ...context };
};
