import { useState, useEffect } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { GiftCardDeposit, Transaction } from "../../types";

function rowToTransaction(row: any): Transaction {
  return {
    id: row.id,
    userId: row.user_id,
    userName: row.user_name,
    userEmail: row.user_email,
    type: row.type,
    amount: row.amount,
    currency: row.currency,
    status: row.status,
    asset: row.asset,
    relatedReferenceId: row.related_reference_id,
    date: row.occurred_at || row.created_at,
    address: row.address,
    txHash: row.tx_hash,
    proofFile: row.proof_file,
    paymentMethod: row.payment_method || "crypto",
    giftCardDetails: row.gift_card_details || undefined,
    giftCardImagePaths: row.gift_card_image_paths || [],
    notes: row.notes,
    destinationTag: row.destination_tag,
    bankDetails: row.bank_details,
    paypalEmail: row.paypal_email
  };
}

/**
 * Transaction ledger (deposits, withdrawals) with ATOMIC balance effects,
 * done via Postgres functions rather than separate JS read-modify-write
 * calls — so a transaction record and its balance change either both
 * happen or neither does. Backed entirely by Supabase. No Firebase.
 */
export function useTransactions(
  supabase: SupabaseClient,
  authReady: boolean,
  userId: string | null,
  isAdmin: boolean
) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const refreshTransactions = async () => {
    if (!authReady || !userId) {
      setTransactions([]);
      return;
    }

    let query = supabase.from("transactions").select("*").order("occurred_at", { ascending: false });
    if (!isAdmin) query = query.eq("user_id", userId);

    const { data, error } = await query;
    if (error) {
      console.error("Failed to load transactions:", error);
      return;
    }
    setTransactions((data || []).map(rowToTransaction));
  };

  useEffect(() => {
    refreshTransactions();
  }, [authReady, userId, isAdmin]);

  const createDepositTransaction = async (input: {
    id: string; userId: string; userEmail: string; userName: string;
    amount: number; currency: string; asset: string; status: "pending" | "completed";
    txHash?: string; proofFile?: string; giftCard?: GiftCardDeposit;
  }) => {
    // Always insert as pending — RLS only allows users to create their own
    // transactions in "pending" status. Instant-complete deposits are then
    // flipped via the same admin-gated RPC used for manual approval.
    const { error } = await supabase.from("transactions").insert({
      id: input.id,
      user_id: input.userId,
      user_email: input.userEmail,
      user_name: input.userName,
      type: "deposit",
      amount: input.amount,
      currency: input.currency,
      asset: input.asset,
      status: "pending",
      tx_hash: input.txHash || null,
      proof_file: input.proofFile || null,
      ...(input.giftCard ? {
        payment_method: "gift_card",
        gift_card_details: input.giftCard.details,
        gift_card_image_paths: input.giftCard.imagePaths
      } : {})
    });
    if (error) throw error;

    // SECURITY (bug #23): no deposit auto-completes. Every deposit stays
    // 'pending' until an admin verifies the real payment and credits it via
    // approve_deposit_transaction. The old instant-credit RPC
    // (complete_own_deposit_transaction) has been neutralized server-side.
    await refreshTransactions();
  };

  const createWithdrawalTransaction = async (input: {
    id: string; userId: string; amount: number; currency: string; asset: string;
    address?: string; destinationTag?: string;
    bankDetails?: Record<string, any>; paypalEmail?: string;
  }) => {
    const { error } = await supabase.rpc("create_withdrawal_transaction", {
      p_id: input.id,
      p_user_id: input.userId,
      p_amount: input.amount,
      p_currency: input.currency,
      p_asset: input.asset,
      p_address: input.address || null,
      p_destination_tag: input.destinationTag || null,
      p_bank_details: input.bankDetails || null,
      p_paypal_email: input.paypalEmail || null
    });
    if (error) throw error;
    await refreshTransactions();
  };

  const approveDeposit = async (transactionId: string, notes: string) => {
    const { error } = await supabase.rpc("approve_deposit_transaction", { p_transaction_id: transactionId, p_notes: notes });
    if (error) throw error;
    await refreshTransactions();
  };

  const rejectDeposit = async (transactionId: string, notes: string) => {
    const { error } = await supabase.rpc("reject_deposit_transaction", { p_transaction_id: transactionId, p_notes: notes });
    if (error) throw error;
    await refreshTransactions();
  };

  const approveWithdrawal = async (transactionId: string, notes: string) => {
    const { error } = await supabase.rpc("approve_withdrawal_transaction", { p_transaction_id: transactionId, p_notes: notes });
    if (error) throw error;
    await refreshTransactions();
  };

  const rejectWithdrawal = async (transactionId: string, notes: string) => {
    const { error } = await supabase.rpc("reject_withdrawal_transaction", { p_transaction_id: transactionId, p_notes: notes });
    if (error) throw error;
    await refreshTransactions();
  };

  return {
    transactions,
    refreshTransactions,
    createDepositTransaction,
    createWithdrawalTransaction,
    approveDeposit,
    rejectDeposit,
    approveWithdrawal,
    rejectWithdrawal
  };
}