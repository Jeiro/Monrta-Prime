import { FALLBACK_GUEST_EMAIL } from "../constants";
import { TRANSACTION_STATUSES } from "../constants/statuses";
import type { BankDetails, DepositWallet, Transaction } from "../types";
import { enrichTransaction, isoTimestamp } from "./transactionsService";
import { timestampId, todayIsoDate } from "./utils";

export const getDepositWalletLabel = (wallet: Pick<DepositWallet, "coinName" | "network">) => {
  const coin = wallet.coinName.trim();
  const network = wallet.network.trim();
  if (!network || coin.toLowerCase() === network.toLowerCase()) return coin;
  return `${coin} ${network}`;
};

export const sortDepositWallets = (wallets: DepositWallet[]) =>
  [...wallets].sort((a, b) => {
    if (a.displayOrder !== b.displayOrder) return a.displayOrder - b.displayOrder;
    return getDepositWalletLabel(a).localeCompare(getDepositWalletLabel(b));
  });

export const getEnabledDepositWallets = (wallets: DepositWallet[]) =>
  sortDepositWallets(wallets.filter(wallet => wallet.enabled));

export const buildDepositWallet = (wallet: Omit<DepositWallet, "id"> & { id?: string }): DepositWallet => ({
  id: wallet.id || timestampId("deposit-wallet"),
  coinName: wallet.coinName.trim(),
  network: wallet.network.trim(),
  walletAddress: wallet.walletAddress.trim(),
  // Trimmed, never substituted: whitespace-only means no tag configured.
  destinationTag: (wallet.destinationTag || "").trim(),
  qrCodeUrl: wallet.qrCodeUrl.trim(),
  minimumDeposit: Number.isFinite(wallet.minimumDeposit) ? Math.max(wallet.minimumDeposit, 0) : 0,
  enabled: wallet.enabled === true,
  displayOrder: Number.isFinite(wallet.displayOrder) ? wallet.displayOrder : 0,
  depositInstructions: wallet.depositInstructions.trim()
});

export const normalizeDepositWallet = (id: string, data: Partial<DepositWallet>): DepositWallet => ({
  id,
  coinName: (data.coinName || "").trim(),
  network: (data.network || "").trim(),
  walletAddress: (data.walletAddress || "").trim(),
  destinationTag: (data.destinationTag || "").trim(),
  qrCodeUrl: (data.qrCodeUrl || "").trim(),
  minimumDeposit: typeof data.minimumDeposit === "number" ? Math.max(data.minimumDeposit, 0) : 0,
  enabled: data.enabled === true,
  displayOrder: typeof data.displayOrder === "number" ? data.displayOrder : 0,
  depositInstructions: (data.depositInstructions || "").trim()
});

export const mapDepositWalletsToAddressBook = (wallets: DepositWallet[]) =>
  getEnabledDepositWallets(wallets).reduce<Record<string, string>>((acc, wallet) => {
    acc[getDepositWalletLabel(wallet)] = wallet.walletAddress;
    acc[wallet.coinName] = acc[wallet.coinName] || wallet.walletAddress;
    acc[`${wallet.coinName}_${wallet.network}`.replace(/\s+/g, "_").toUpperCase()] = wallet.walletAddress;
    return acc;
  }, {});

export const buildDepositTransaction = (
  amount: number,
  currency: string,
  userEmail: string | null,
  adminWallets: Record<string, string>,
  txHash?: string,
  proofFile?: string
): { transaction: Transaction; isManual: boolean } => {
  const isManual = !!txHash || !!proofFile || currency !== "USD";
  // SECURITY (bug #23): every deposit is created PENDING and must be credited
  // by an admin (approve_deposit_transaction) after verifying the real payment.
  // Previously a plain USD deposit with no proof was auto-completed via
  // complete_own_deposit_transaction — which, for real money, let a user
  // self-credit an arbitrary balance with no verification. No deposit
  // auto-completes anymore.
  const status = TRANSACTION_STATUSES.PENDING;
  const id = timestampId("tx-dep");
  const timestamp = isoTimestamp();

  return {
    isManual,
    transaction: enrichTransaction({
      id,
      type: "deposit",
      amount,
      status,
      asset: currency,
      date: todayIsoDate(),
      address: isManual ? adminWallets[currency] : undefined,
      txHash: txHash || `0xhash${Date.now().toString(16)}`,
      proofFile: proofFile || (isManual ? "deposit_proof.jpg" : undefined),
      userEmail: userEmail || FALLBACK_GUEST_EMAIL
    }, { userEmail }, { currency, relatedReferenceId: txHash || id, timestamp })
  };
};

export const formatWithdrawalAddress = (
  currency: string,
  address?: string,
  destinationTag?: string,
  bankDetails?: BankDetails,
  paypalEmail?: string
) => {
  if (currency === "PayPal" && paypalEmail) {
    return `PayPal: ${paypalEmail}`;
  }
  if (currency === "Bank" && bankDetails) {
    return `${bankDetails.bankName} (Acct: ${bankDetails.accountNumber}, Name: ${bankDetails.accountName}, Routing: ${bankDetails.routingCode})`;
  }
  if (currency === "XRP" && destinationTag) {
    return `${address} (Tag: ${destinationTag})`;
  }
  return address || "United States Bank wire";
};

export const buildWithdrawalTransaction = (
  amount: number,
  currency: string,
  userEmail: string | null,
  address: string,
  destinationTag?: string,
  bankDetails?: BankDetails,
  paypalEmail?: string
): Transaction => {
  const id = timestampId("tx-wdr");

  return enrichTransaction({
    id,
    type: "withdrawal",
    amount,
    status: TRANSACTION_STATUSES.PENDING,
    asset: currency,
    date: todayIsoDate(),
    address,
    destinationTag,
    bankDetails,
    paypalEmail,
    userEmail: userEmail || FALLBACK_GUEST_EMAIL
  }, { userEmail }, { currency, relatedReferenceId: id });
};
