import React, { createContext, useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import type { DepositWallet, Transaction, WalletFeedback } from "../../types";
import {
  buildDepositTransaction,
  buildWithdrawalTransaction,
  formatWithdrawalAddress,
  USE_MOCK_DATA
} from "../../services";
import { useTransactions } from "../../hooks/data/useTransactions";
import { useDepositWallets } from "../../hooks/data/useDepositWallets";
import { useWalletFeedback } from "../../hooks/data/useWalletFeedback";
import { useSession } from "./SessionContext";
import { useAuditLogWriter } from "./AuditLogContext";
import { useNotifications } from "./NotificationsContext";
import { useAdminUsersData } from "./AdminUsersContext";

interface WalletDataContextType {
  /** Every user's rows when the caller is an admin, otherwise just their own. */
  adminTransactions: Transaction[];
  refreshTransactions: () => Promise<void>;
  depositWallets: DepositWallet[];
  enabledDepositWallets: DepositWallet[];
  adminWallets: Record<string, string>;
}

interface WalletActionsContextType {
  insufficientBalanceOpen: boolean;
  setInsufficientBalanceOpen: (open: boolean) => void;
  deposit: (amount: number, currency: string, txHash?: string, proofFile?: string) => boolean;
  withdraw: (
    amount: number,
    currency: string,
    address?: string,
    destinationTag?: string,
    bankDetails?: { accountNumber: string; bankName: string; accountName: string; routingCode: string },
    paypalEmail?: string
  ) => { success: boolean; message: string };
  updateAdminWallets: (wallets: Record<string, string>) => void;
  adminSaveDepositWallet: (wallet: DepositWallet | Omit<DepositWallet, "id">) => Promise<void>;
  adminDeleteDepositWallet: (walletId: string) => Promise<void>;
  adminApproveDeposit: (txId: string, notes?: string) => void;
  adminRejectDeposit: (txId: string, notes?: string) => void;
  adminApproveWithdrawal: (txId: string, notes?: string) => void;
  adminRejectWithdrawal: (txId: string, notes?: string) => void;
  saveWalletConnection: (walletName?: string) => void;
  walletFeedback: WalletFeedback[];
  submitWalletFeedback: (wallet: string, reason: string, wouldUse: boolean) => Promise<void>;
  adminUpdateWalletFeedback: (id: string, status: "new" | "reviewed", adminNotes?: string) => Promise<void>;
  adminDeleteWalletFeedback: (id: string) => Promise<void>;
}

/** Internal-only: the transaction/deposit-wallet mutators the handlers use. */
interface WalletInternalsContextType extends WalletDataContextType {
  createDepositTransaction: ReturnType<typeof useTransactions>["createDepositTransaction"];
  createWithdrawalTransaction: ReturnType<typeof useTransactions>["createWithdrawalTransaction"];
  approveDepositTx: ReturnType<typeof useTransactions>["approveDeposit"];
  rejectDepositTx: ReturnType<typeof useTransactions>["rejectDeposit"];
  approveWithdrawalTx: ReturnType<typeof useTransactions>["approveWithdrawal"];
  rejectWithdrawalTx: ReturnType<typeof useTransactions>["rejectWithdrawal"];
  saveDepositWallet: ReturnType<typeof useDepositWallets>["saveDepositWallet"];
  deleteDepositWallet: ReturnType<typeof useDepositWallets>["deleteDepositWallet"];
}

const WalletDataContext = createContext<WalletInternalsContextType | undefined>(undefined);
const WalletActionsContext = createContext<WalletActionsContextType | undefined>(undefined);

/**
 * The transaction ledger and the deposit address book, mounted LOW in the
 * tree: the admin-users handlers and the airdrop approval flow both refresh
 * the ledger after crediting a balance, and they sit above the wallet
 * handlers. Everything user-facing goes through `useWallet()` instead, which
 * merges this with the handlers below.
 */
export const WalletDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { supabase, user, setUser, authReady, currentSupabaseUserId, currentUserIsAdmin, currentUserIsLoggedIn } = useSession();
  const {
    transactions: supabaseTransactions,
    refreshTransactions,
    createDepositTransaction,
    createWithdrawalTransaction,
    approveDeposit: approveDepositTx,
    rejectDeposit: rejectDepositTx,
    approveWithdrawal: approveWithdrawalTx,
    rejectWithdrawal: rejectWithdrawalTx
  } = useTransactions(supabase, authReady, currentSupabaseUserId, currentUserIsAdmin);
  const {
    depositWallets,
    enabledDepositWallets,
    adminWallets,
    saveDepositWallet,
    deleteDepositWallet
  } = useDepositWallets(supabase, authReady, currentUserIsLoggedIn);

  // Keep the signed-in user's own transaction history in sync with Supabase.
  // supabaseTransactions holds every user's rows when the caller is an admin
  // (see useTransactions), so this must filter down to just the caller's own
  // — otherwise an admin's personal wallet page would show everyone's
  // transactions merged together.
  //
  // Like every other `user` overlay effect, this depends on user.isLoggedIn as
  // well as its hook data: the data hooks can resolve BEFORE the profile
  // loader sets isLoggedIn true, and without that dependency the early fire
  // hits the guard as a no-op and never re-runs, stranding the fetched data.
  useEffect(() => {
    setUser(prev => prev.isLoggedIn
      ? { ...prev, transactions: supabaseTransactions.filter(t => t.userId === currentSupabaseUserId) }
      : prev);
  }, [supabaseTransactions, currentSupabaseUserId, user.isLoggedIn]);

  return (
    <WalletDataContext.Provider value={{
      adminTransactions: supabaseTransactions,
      refreshTransactions,
      depositWallets,
      enabledDepositWallets,
      adminWallets,
      createDepositTransaction,
      createWithdrawalTransaction,
      approveDepositTx,
      rejectDepositTx,
      approveWithdrawalTx,
      rejectWithdrawalTx,
      saveDepositWallet,
      deleteDepositWallet
    }}>
      {children}
    </WalletDataContext.Provider>
  );
};

export const useWalletData = () => {
  const context = useContext(WalletDataContext);
  if (context === undefined) {
    throw new Error("useWalletData must be used inside a WalletDataProvider");
  }
  return context;
};

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { supabase, user, setUser, authReady, currentSupabaseUserId, currentUserProfile, refetchCurrentUserProfile, currentUserIsLoggedIn, currentUserIsAdmin } = useSession();
  const { handleLog } = useAuditLogWriter();
  const { addNotification, notifyAdmins, dispatchTransactionalEmail } = useNotifications();
  const { usersDirectory } = useAdminUsersData();
  const {
    adminTransactions: supabaseTransactions,
    adminWallets,
    createDepositTransaction,
    createWithdrawalTransaction,
    approveDepositTx,
    rejectDepositTx,
    approveWithdrawalTx,
    rejectWithdrawalTx,
    saveDepositWallet,
    deleteDepositWallet
  } = useWalletData();
  const {
    walletFeedback,
    submitWalletFeedback: submitWalletFeedbackToDb,
    adminUpdateWalletFeedback: updateWalletFeedbackInDb,
    adminDeleteWalletFeedback: deleteWalletFeedbackFromDb
  } = useWalletFeedback(supabase, authReady, currentUserIsLoggedIn, currentUserIsAdmin);

  const [insufficientBalanceOpen, setInsufficientBalanceOpen] = useState(false);

  const deposit = (amount: number, currency: string, txHash?: string, proofFile?: string): boolean => {
    if (amount <= 0) return false;
    if (!currentSupabaseUserId) return false;

    const { transaction: newTx } = buildDepositTransaction(amount, currency, user.email, adminWallets, txHash, proofFile);
    const statusType = newTx.status;

    createDepositTransaction({
      id: newTx.id,
      userId: currentSupabaseUserId,
      userEmail: user.email || "",
      userName: currentUserProfile?.name || user.name || "Unknown",
      amount,
      currency,
      asset: currency,
      status: statusType === "completed" ? "completed" : "pending",
      txHash: newTx.txHash,
      proofFile: newTx.proofFile
    }).then(() => {
      if (statusType === "completed") refetchCurrentUserProfile();
    }).catch(error => {
      console.error("Deposit failed:", error);
      toast.error("Failed to submit deposit. Please try again.");
    });

    handleLog("Asset Deposit Action", `Recharged requested: $${amount} ${currency}. Status: ${statusType}`, user.email || "system", "success");
    addNotification(`Your ${currency} deposit of ${amount} has been submitted for review.`, { title: "Deposit submitted", type: statusType === "completed" ? "success" : "info", eventKey: `deposit:submitted:${newTx.id}`, action: { label: "View wallet", view: "dashboard-wallet" } });
    dispatchTransactionalEmail(user.email, statusType === "completed" ? "DEPOSIT_APPROVED" : "DEPOSIT_SUBMITTED", `deposit:${statusType === "completed" ? "approved" : "submitted"}:${newTx.id}`, { name: user.name, amount, asset: currency, txHash: newTx.txHash, transactionId: newTx.id, status: statusType });
    if (statusType !== "completed") {
      notifyAdmins(`${user.email || "A user"} submitted a ${currency} deposit of ${amount} for review.`, { title: "Deposit requires review", type: "warning", eventKey: `deposit:review:${newTx.id}`, action: { label: "Review deposits", view: "dashboard-admin" } });
    }

    toast.success(`Deposit request submitted for ${amount} ${currency}`);
    return true;
  };

  const withdraw = (
    amount: number,
    currency: string,
    address?: string,
    destinationTag?: string,
    bankDetails?: { accountNumber: string; bankName: string; accountName: string; routingCode: string },
    paypalEmail?: string
  ): { success: boolean; message: string } => {
    if (user.kyc?.status !== "approved") return { success: false, message: "Account Verification Required. Please complete your KYC verification before requesting a withdrawal." };
    if (amount <= 0) return { success: false, message: "Invalid amount specified." };
    if (!currentSupabaseUserId) return { success: false, message: "Not signed in." };
    const currentBalance = currentUserProfile?.balance ?? user.balance;
    if (currentBalance < amount) return { success: false, message: "Insufficient withdrawable balance." };

    const displayAddress = formatWithdrawalAddress(currency, address, destinationTag, bankDetails, paypalEmail);
    const newTx = buildWithdrawalTransaction(amount, currency, user.email, displayAddress, destinationTag, bankDetails, paypalEmail);

    createWithdrawalTransaction({
      id: newTx.id,
      userId: currentSupabaseUserId,
      amount,
      currency,
      asset: currency,
      address: displayAddress,
      destinationTag,
      bankDetails,
      paypalEmail
    }).then(() => {
      refetchCurrentUserProfile();
    }).catch(error => {
      console.error("Withdrawal failed:", error);
      toast.error(error?.message?.includes("Insufficient") ? "Insufficient balance." : "Failed to submit withdrawal.");
    });

    handleLog("Asset Withdrawal Action", `Requested payout of $${amount} ${currency} to ${displayAddress}. Queued for Review.`, user.email || "system", "warning");
    addNotification(`Your withdrawal request of $${amount} ${currency} has been submitted for review.`, { title: "Withdrawal submitted", type: "info", eventKey: `withdrawal:submitted:${newTx.id}`, action: { label: "View wallet", view: "dashboard-wallet" } });
    dispatchTransactionalEmail(user.email, "WITHDRAWAL_SUBMITTED", `withdrawal:submitted:${newTx.id}`, { name: user.name, amount, asset: currency, destination: displayAddress, walletAddress: displayAddress, transactionId: newTx.id, status: newTx.status });
    notifyAdmins(`${user.email || "A user"} submitted a withdrawal request of $${amount} ${currency}.`, { title: "Withdrawal requires review", type: "warning", eventKey: `withdrawal:review:${newTx.id}`, action: { label: "Review withdrawals", view: "dashboard-admin" } });

    toast.success("Withdrawal request submitted successfully");
    return { success: true, message: `Payout request queued. Balance deducted. Pending Platform Approval.` };
  };

  // NOTE: adminWallets is now derived from depositWallets (via useDepositWallets),
  // not its own settable state — use adminSaveDepositWallet/adminDeleteDepositWallet
  // to actually change wallet data. This function appears unused elsewhere in the
  // app; kept as a no-op for interface compatibility rather than removed outright.
  const updateAdminWallets = async (wallets: Record<string, string>) => {
    console.warn("updateAdminWallets is deprecated — use adminSaveDepositWallet instead.");
  };

  const adminSaveDepositWallet = async (walletInput: DepositWallet | Omit<DepositWallet, "id">) => {
    try {
      const wallet = await saveDepositWallet(walletInput);
      handleLog("Deposit Wallet Updated", `Saved ${wallet.coinName} ${wallet.network} deposit wallet.`, user.email || "admin", "success");
      addNotification("Deposit wallet saved successfully.");
    } catch (error) {
      console.error("Failed to save deposit wallet:", error);
      throw error;
    }
  };

  const adminDeleteDepositWallet = async (walletId: string) => {
    try {
      await deleteDepositWallet(walletId);
      handleLog("Deposit Wallet Removed", `Deleted deposit wallet ${walletId}.`, user.email || "admin", "warning");
      addNotification("Deposit wallet deleted.");
    } catch (error) {
      console.error("Failed to delete deposit wallet:", error);
      throw error;
    }
  };

  const adminApproveDeposit = async (txId: string, noteText: string = "Deposit verified by admin.") => {
    const matchingTx = supabaseTransactions.find(t => t.id === txId);
    if (!matchingTx) return;

    try {
      await approveDepositTx(txId, noteText);
      await refetchCurrentUserProfile();
      handleLog("Manual Deposit Confirmed", `Approved deposit ID: ${txId} worth ${matchingTx.amount} ${matchingTx.asset}`, user.email || "admin", "success");
      addNotification(`Approved incoming deposit of ${matchingTx.amount} for ${matchingTx.userName || matchingTx.userEmail}.`, { title: "Deposit approved", type: "success", eventKey: `admin:deposit:approved:${txId}` });
      addNotification(`Your ${matchingTx.asset} deposit of ${matchingTx.amount} was approved.`, { title: "Deposit approved", type: "success", recipientEmail: matchingTx.userEmail, eventKey: `deposit:approved:${txId}`, action: { label: "View wallet", view: "dashboard-wallet" } });
      dispatchTransactionalEmail(matchingTx.userEmail, "DEPOSIT_APPROVED", `deposit:approved:${txId}`, {
        name: matchingTx.userName,
        amount: matchingTx.amount,
        asset: matchingTx.asset,
        txHash: matchingTx.txHash || txId,
        transactionId: txId,
        status: "approved"
      });
    } catch (e) {
      console.error("Error approving deposit:", e);
      toast.error("Failed to approve deposit.");
    }
  };

  const adminRejectDeposit = async (txId: string, noteText: string = "Payment proof verification unsuccessful.") => {
    const matchingTx = supabaseTransactions.find(t => t.id === txId);
    if (!matchingTx) return;

    try {
      await rejectDepositTx(txId, noteText);
      handleLog("Manual Deposit Rejected", `Rejected deposit ID: ${txId}. Reason: ${noteText}`, user.email || "admin", "alert");
      addNotification(`Rejected proof on deposit ${txId}. Dispatched alert log.`, { title: "Deposit rejected", type: "warning", eventKey: `admin:deposit:rejected:${txId}` });
      addNotification(`Your deposit ${txId} was rejected. ${noteText}`, { title: "Deposit rejected", type: "error", recipientEmail: matchingTx.userEmail, eventKey: `deposit:rejected:${txId}`, action: { label: "View wallet", view: "dashboard-wallet" } });
      dispatchTransactionalEmail(matchingTx.userEmail, "DEPOSIT_REJECTED", `deposit:rejected:${txId}`, { name: matchingTx.userName, amount: matchingTx.amount, asset: matchingTx.asset, transactionId: txId, reason: noteText, status: "rejected" });
    } catch (e) {
      console.error("Error rejecting deposit:", e);
      toast.error("Failed to reject deposit.");
    }
  };

  // Resolve a transaction's requesting user. The denormalized user_email /
  // user_name columns can be blank on older rows — fall back to the users
  // directory by user_id so notifications, emails and admin tables never end
  // up with an empty recipient (which would silently drop the email).
  const resolveTxRecipient = (tx: Transaction): { email: string; name: string } => {
    const profile = tx.userId ? usersDirectory.find(u => u.id === tx.userId) : undefined;
    return {
      email: tx.userEmail || profile?.email || "",
      name: tx.userName || profile?.name || profile?.email || "there",
    };
  };

  const adminApproveWithdrawal = async (txId: string, noteText: string = "Processed successfully via gateway ledger.") => {
    const tx = supabaseTransactions.find(t => t.id === txId);
    if (!tx) return;

    const recipient = resolveTxRecipient(tx);
    try {
      await approveWithdrawalTx(txId, noteText);
      handleLog("Withdrawing Dispatched", `Released payout ID: ${txId}. Notes: ${noteText}`, user.email || "admin", "success");
      addNotification(`Settled withdrawal invoice ${txId}. Funds successfully dispatched.`, { title: "Withdrawal approved", type: "success", eventKey: `admin:withdrawal:approved:${txId}` });
      addNotification(`Your withdrawal ${txId} was approved and dispatched.`, { title: "Withdrawal approved", type: "success", recipientEmail: recipient.email, eventKey: `withdrawal:approved:${txId}`, action: { label: "View wallet", view: "dashboard-wallet" } });
      dispatchTransactionalEmail(recipient.email, "WITHDRAWAL_APPROVED", `withdrawal:approved:${txId}`, {
        name: recipient.name,
        amount: tx.amount,
        asset: tx.asset,
        walletAddress: tx.address || tx.notes || "Stored Custody",
        transactionId: txId,
        status: "approved"
      });
    } catch (e) {
      console.error("Error approving withdrawal:", e);
      toast.error("Failed to approve withdrawal.");
    }
  };

  const adminRejectWithdrawal = async (txId: string, noteTextByAdmin: string = "Declined due to security validations.") => {
    const matched = supabaseTransactions.find(t => t.id === txId);
    if (!matched) return;

    const recipient = resolveTxRecipient(matched);
    try {
      await rejectWithdrawalTx(txId, noteTextByAdmin);
      if (user.email && recipient.email && user.email.toLowerCase() === recipient.email.toLowerCase()) {
        await refetchCurrentUserProfile();
      }
      handleLog("Withdrawal Denied", `Security block enforced on withdrawal ID: ${txId}. Credited $${matched.amount} back to user balance. Reason: ${noteTextByAdmin}`, user.email || "admin", "alert");
      addNotification(`Withdrawal ${txId} was rejected. Funds returned to wallet.`, { title: "Withdrawal rejected", type: "warning", eventKey: `admin:withdrawal:rejected:${txId}` });
      addNotification(`Your withdrawal ${txId} was rejected and funds were returned to your wallet.`, { title: "Withdrawal rejected", type: "error", recipientEmail: recipient.email, eventKey: `withdrawal:rejected:${txId}`, action: { label: "View wallet", view: "dashboard-wallet" } });
      dispatchTransactionalEmail(recipient.email, "WITHDRAWAL_REJECTED", `withdrawal:rejected:${txId}`, { name: recipient.name, amount: matched.amount, asset: matched.asset, walletAddress: matched.address || matched.notes, transactionId: txId, reason: noteTextByAdmin, status: "rejected" });
    } catch (e) {
      console.error("Error rejecting withdrawal:", e);
      toast.error("Failed to reject withdrawal.");
    }
  };

  const saveWalletConnection = async (walletName?: string) => {
    if (!user.email) return;
    try {
      if (currentSupabaseUserId) {
        const { error } = await supabase
          .from("users")
          .update({ connected_wallet_name: walletName || "" })
          .eq("id", currentSupabaseUserId);
        if (error) console.error("Failed to sync wallet connection to Supabase:", error);
      }

      setUser(prev => ({ ...prev, connectedWalletName: walletName || "" }));
      addNotification("Wallet connection preference saved.");
    } catch (e) {
      console.error("Error saving wallet connection preference:", e);
    }
  };

  const submitWalletFeedback = async (wallet: string, reason: string, wouldUse: boolean) => {
    if (!user.email || USE_MOCK_DATA) return;

    try {
      const result = await submitWalletFeedbackToDb(wallet, reason, wouldUse);
      toast.success("Successful");
      if (!result?.duplicate) {
        handleLog("Wallet Feedback", `User submitted feedback for ${wallet}`, user.email, "success");
      }
    } catch (e) {
      console.error("Error submitting wallet feedback:", e);
      toast.error("Failed to submit feedback");
    }
  };

  const adminUpdateWalletFeedback = async (id: string, status: "new" | "reviewed", adminNotes?: string) => {
    if (USE_MOCK_DATA) return;
    try {
      await updateWalletFeedbackInDb(id, status, adminNotes);
    } catch (e) {
      console.error("Error updating wallet feedback:", e);
    }
  };

  const adminDeleteWalletFeedback = async (id: string) => {
    if (USE_MOCK_DATA) return;
    try {
      await deleteWalletFeedbackFromDb(id);
    } catch (e) {
      console.error("Error deleting wallet feedback:", e);
    }
  };

  return (
    <WalletActionsContext.Provider value={{
      insufficientBalanceOpen,
      setInsufficientBalanceOpen,
      deposit,
      withdraw,
      updateAdminWallets,
      adminSaveDepositWallet,
      adminDeleteDepositWallet,
      adminApproveDeposit,
      adminRejectDeposit,
      adminApproveWithdrawal,
      adminRejectWithdrawal,
      saveWalletConnection,
      walletFeedback,
      submitWalletFeedback,
      adminUpdateWalletFeedback,
      adminDeleteWalletFeedback
    }}>
      {children}
    </WalletActionsContext.Provider>
  );
};

export const useWallet = (): WalletDataContextType & WalletActionsContextType => {
  const { adminTransactions, refreshTransactions, depositWallets, enabledDepositWallets, adminWallets } = useWalletData();
  const context = useContext(WalletActionsContext);
  if (context === undefined) {
    throw new Error("useWallet must be used inside a WalletProvider");
  }
  return { adminTransactions, refreshTransactions, depositWallets, enabledDepositWallets, adminWallets, ...context };
};
