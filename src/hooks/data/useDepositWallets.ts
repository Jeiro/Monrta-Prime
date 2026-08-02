import { useState, useEffect, useMemo } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { DepositWallet } from "../../types";
import {
  USE_MOCK_DATA,
  getMockDepositWallets,
  saveMockDepositWallet,
  deleteMockDepositWallet,
  buildDepositWallet,
  getEnabledDepositWallets,
  mapDepositWalletsToAddressBook
} from "../../services";

function walletRowToItem(row: any): DepositWallet {
  return {
    id: row.id,
    coinName: row.coin_name,
    network: row.network,
    walletAddress: row.wallet_address,
    // Coalesced, not defaulted: a null/missing column reads as "no tag
    // configured", which is what the deposit UI keys its fail-safe off.
    destinationTag: row.destination_tag ?? "",
    qrCodeUrl: row.qr_code_url,
    minimumDeposit: row.minimum_deposit,
    enabled: row.enabled,
    displayOrder: row.display_order,
    depositInstructions: row.deposit_instructions
  };
}

function walletToRow(wallet: DepositWallet): Record<string, any> {
  return {
    id: wallet.id,
    coin_name: wallet.coinName,
    network: wallet.network,
    wallet_address: wallet.walletAddress,
    destination_tag: wallet.destinationTag ?? "",
    qr_code_url: wallet.qrCodeUrl,
    minimum_deposit: wallet.minimumDeposit,
    enabled: wallet.enabled,
    display_order: wallet.displayOrder,
    deposit_instructions: wallet.depositInstructions
  };
}

/**
 * Admin-managed crypto deposit wallet addresses. Backed entirely by
 * Supabase's `deposit_wallets` table. No Firebase.
 */
export function useDepositWallets(supabase: SupabaseClient, authReady: boolean, isLoggedIn: boolean) {
  const [depositWallets, setDepositWallets] = useState<DepositWallet[]>(() => getMockDepositWallets());
  const enabledDepositWallets = useMemo(() => getEnabledDepositWallets(depositWallets), [depositWallets]);
  const adminWallets = useMemo(() => mapDepositWalletsToAddressBook(depositWallets), [depositWallets]);

  useEffect(() => {
    if (USE_MOCK_DATA) {
      setDepositWallets(getMockDepositWallets());
      return;
    }

    if (!authReady || !isLoggedIn) {
      setDepositWallets([]);
      return;
    }

    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("deposit_wallets")
        .select("*")
        .order("display_order", { ascending: true });

      if (cancelled) return;

      if (error) {
        console.error("Failed to load deposit wallets:", error);
        return;
      }

      setDepositWallets((data || []).map(walletRowToItem));
    })();

    return () => { cancelled = true; };
  }, [authReady, isLoggedIn]);

  const saveDepositWallet = async (walletInput: DepositWallet | Omit<DepositWallet, "id">) => {
    const wallet = buildDepositWallet(walletInput as DepositWallet & { id?: string });

    if (USE_MOCK_DATA) {
      saveMockDepositWallet(wallet);
      setDepositWallets(getMockDepositWallets());
      return wallet;
    }

    const { error } = await supabase
      .from("deposit_wallets")
      .upsert(walletToRow(wallet), { onConflict: "id" });
    if (error) throw error;

    setDepositWallets(prev => {
      const exists = prev.some(item => item.id === wallet.id);
      return exists ? prev.map(item => item.id === wallet.id ? wallet : item) : [...prev, wallet];
    });
    return wallet;
  };

  const deleteDepositWallet = async (walletId: string) => {
    if (USE_MOCK_DATA) {
      deleteMockDepositWallet(walletId);
      setDepositWallets(getMockDepositWallets());
      return;
    }

    const { error } = await supabase.from("deposit_wallets").delete().eq("id", walletId);
    if (error) throw error;

    setDepositWallets(prev => prev.filter(item => item.id !== walletId));
  };

  return { depositWallets, enabledDepositWallets, adminWallets, saveDepositWallet, deleteDepositWallet };
}