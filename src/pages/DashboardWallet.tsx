import React, { useEffect, useMemo, useRef, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { useSession } from "../context/domains/SessionContext";
import { useWallet } from "../context/domains/WalletContext";
import { useNotifications } from "../context/domains/NotificationsContext";
import { useSupabaseClient, uploadDepositProof } from "../lib/supabase";
import { getDepositWalletLabel } from "../services";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  History,
  ImageUp,
  MinusSquare,
  PlusSquare,
  Wallet,
  XCircle,
} from "lucide-react";
import { formatDateTime, formatMoney } from "../lib/format";
import {
  Alert,
  Badge,
  Button,
  ChoiceGrid,
  Column,
  DataTable,
  Input,
  SectionCard,
  Tabs,
} from "../components/ui";

interface DashboardWalletProps {
  initialOpenTab?: "deposit" | "withdraw" | "ledger";
}

type WalletTab = "deposit" | "withdraw" | "ledger";

export const DashboardWallet: React.FC<DashboardWalletProps> = ({ initialOpenTab = "deposit" }) => {
  const { user } = useSession();
  const { deposit, withdraw, enabledDepositWallets } = useWallet();
  const { addNotification } = useNotifications();
  const { user: clerkUser } = useUser();
  const supabase = useSupabaseClient();
  const [activeSubTab, setActiveSubTab] = useState<WalletTab>(initialOpenTab);
  const [showBalance, setShowBalance] = useState(true);

  // Deposit states
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [depositCurrency, setDepositCurrency] = useState("USDT ERC20");
  const [depositAmountTxt, setDepositAmountTxt] = useState("");
  const [depositTxHash, setDepositTxHash] = useState("");
  const [depositProofName, setDepositProofName] = useState("");
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [depositSuccessLog, setDepositSuccessLog] = useState<string | null>(null);
  const [submittingDeposit, setSubmittingDeposit] = useState(false);

  const depositWalletOptions = useMemo(
    () => enabledDepositWallets.map((wallet) => ({ wallet, label: getDepositWalletLabel(wallet) })),
    [enabledDepositWallets]
  );
  const selectedDepositWallet =
    depositWalletOptions.find((option) => option.label === depositCurrency)?.wallet ||
    depositWalletOptions[0]?.wallet;
  const selectedDepositLabel = selectedDepositWallet
    ? getDepositWalletLabel(selectedDepositWallet)
    : depositCurrency;
  const selectedMinimumDeposit = selectedDepositWallet?.minimumDeposit || 0;
  const selectedQrCodeUrl =
    selectedDepositWallet?.qrCodeUrl ||
    (selectedDepositWallet?.walletAddress
      ? `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
          selectedDepositWallet.walletAddress
        )}`
      : "");

  useEffect(() => {
    if (depositWalletOptions.length === 0) return;
    if (!depositWalletOptions.some((option) => option.label === depositCurrency)) {
      setDepositCurrency(depositWalletOptions[0].label);
    }
  }, [depositCurrency, depositWalletOptions]);

  const triggerDepositFeedback = (msg: string) => {
    setDepositSuccessLog(msg);
    setTimeout(() => setDepositSuccessLog(null), 7000);
  };

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDepositSuccessLog(null);

    if (!selectedDepositWallet) {
      triggerDepositFeedback("Error: No enabled deposit wallet is currently available.");
      return;
    }

    const amount = parseFloat(depositAmountTxt);
    if (!amount || amount < selectedMinimumDeposit) {
      triggerDepositFeedback(
        `Error: The minimum deposit amount is $${selectedMinimumDeposit.toLocaleString()} equivalent.`
      );
      return;
    }

    setSubmittingDeposit(true);
    try {
      let finalProofURL = depositProofName || "payment_proof_receipt.jpg";

      if (fileInputRef.current?.files?.[0] && clerkUser?.id) {
        try {
          const file = fileInputRef.current.files[0];
          finalProofURL = await uploadDepositProof(supabase, clerkUser.id, file);
        } catch (err) {
          console.error("Error uploading deposit proof:", err);
        }
      }

      const success = deposit(
        amount,
        selectedDepositLabel,
        depositTxHash.trim() || "N/A",
        finalProofURL
      );
      if (success) {
        setDepositAmountTxt("");
        setDepositTxHash("");
        setDepositProofName("");
        triggerDepositFeedback(
          `Successfully submitted! Mapped $${amount} ${selectedDepositLabel} secure deposit pending verification. ${
            depositTxHash.trim() ? "Transaction Hash registered." : ""
          }`
        );
      } else {
        triggerDepositFeedback("Error occurred while processing deposit.");
      }
    } finally {
      setSubmittingDeposit(false);
    }
  };

  const handleCopyAddr = () => {
    if (!selectedDepositWallet?.walletAddress) return;
    navigator.clipboard.writeText(selectedDepositWallet.walletAddress);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  // Withdraw states
  const [wdrCurrency, setWdrCurrency] = useState("USDT");
  const [wdrNetwork, setWdrNetwork] = useState("TRC20");
  const [wdrAmountTxt, setWdrAmountTxt] = useState("");
  const [wdrAddress, setWdrAddress] = useState("");
  const [wdrLog, setWdrLog] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [submittingWithdraw, setSubmittingWithdraw] = useState(false);

  // Supplementary states for bank/paypal/xrp tag
  const [destinationTag, setDestinationTag] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [routingCode, setRoutingCode] = useState("");
  const [paypalEmail, setPaypalEmail] = useState("");

  const validateWithdrawal = (): { valid: boolean; message: string } => {
    const amount = parseFloat(wdrAmountTxt);
    if (!amount || amount <= 0) {
      return { valid: false, message: "Error: Please specify valid numerical withdraw quantities." };
    }
    if (user.balance < amount) {
      return { valid: false, message: "Error: Insufficient withdrawable balance." };
    }

    if (wdrCurrency === "PayPal") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!paypalEmail.trim()) {
        return { valid: false, message: "Error: PayPal email is required." };
      }
      if (!emailRegex.test(paypalEmail)) {
        return { valid: false, message: "Error: Please enter a logical PayPal email address." };
      }
    } else if (wdrCurrency === "Bank") {
      if (!bankName.trim()) return { valid: false, message: "Error: Bank Name is required." };
      if (!accountNumber.trim()) return { valid: false, message: "Error: Account number is required." };
      if (!accountName.trim()) return { valid: false, message: "Error: Account name is required." };
      if (!routingCode.trim()) return { valid: false, message: "Error: Routing code is required." };

      const acctRegex = /^[a-zA-Z0-9\- ]{4,30}$/;
      if (!acctRegex.test(accountNumber)) {
        return { valid: false, message: "Error: Account number should be 4-30 characters alphanumeric." };
      }
      const routingRegex = /^[a-zA-Z0-9]{4,15}$/;
      if (!routingRegex.test(routingCode)) {
        return { valid: false, message: "Error: Routing code should be 4-15 characters alphanumeric." };
      }
    } else {
      if (!wdrAddress.trim()) {
        return { valid: false, message: "Error: Withdrawal address is required." };
      }

      if (wdrCurrency === "BTC") {
        const btcRegex = /^(?:1[a-km-zA-HJ-NP-Z1-9]{25,34}|3[a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-zA-Z0-9]{25,62})$/;
        if (!btcRegex.test(wdrAddress)) {
          return { valid: false, message: "Error: Invalid Bitcoin (BTC) address format. Must start with 1, 3, or bc1." };
        }
      } else if (wdrCurrency === "ETH") {
        const ethRegex = /^0x[a-fA-F0-9]{40}$/;
        if (!ethRegex.test(wdrAddress)) {
          return { valid: false, message: "Error: Invalid Ethereum (ETH) address format. Must start with 0x followed by 40 hex digits." };
        }
      } else if (wdrCurrency === "SOL") {
        const solRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
        if (!solRegex.test(wdrAddress)) {
          return { valid: false, message: "Error: Invalid Solana (SOL) address format. Must be 32-44 base58 characters." };
        }
      } else if (wdrCurrency === "XRP") {
        const xrpRegex = /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/;
        if (!xrpRegex.test(wdrAddress)) {
          return { valid: false, message: "Error: Invalid Ripple (XRP) address format. Must start with 'r' and be 25-35 base58 characters." };
        }
        if (!destinationTag.trim()) {
          return { valid: false, message: "Error: XRP Destination Tag / Memo is required. Enter a tags code, or '0' if not required." };
        }
        const tagRegex = /^[a-zA-Z0-9]{1,10}$/;
        if (!tagRegex.test(destinationTag)) {
          return { valid: false, message: "Error: Destination Tag / Memo must be alphanumeric, up to 10 characters." };
        }
      } else if (wdrCurrency === "USDT") {
        if (wdrNetwork === "TRC20") {
          const trcRegex = /^T[1-9A-HJ-NP-Za-km-z]{33}$/;
          if (!trcRegex.test(wdrAddress)) {
            return { valid: false, message: "Error: Invalid TRC20 USDT address format. Must start with T." };
          }
        } else {
          const ethRegex = /^0x[a-fA-F0-9]{40}$/;
          if (!ethRegex.test(wdrAddress)) {
            return { valid: false, message: "Error: Invalid USDT address format. Must start with 0x for ERC20/BEP20." };
          }
        }
      }
    }

    return { valid: true, message: "" };
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWdrLog(null);

    const check = validateWithdrawal();
    if (!check.valid) {
      setWdrLog({ type: "error", message: check.message });
      return;
    }

    const amount = parseFloat(wdrAmountTxt);
    let currencyWithNetwork = wdrCurrency;
    if (wdrCurrency === "USDT") {
      currencyWithNetwork = `USDT (${wdrNetwork})`;
    } else if (wdrCurrency === "Bank") {
      currencyWithNetwork = "Bank Withdrawal";
    } else if (wdrCurrency === "PayPal") {
      currencyWithNetwork = "PayPal Withdrawal";
    }

    setSubmittingWithdraw(true);
    try {
      const res = await withdraw(
        amount,
        currencyWithNetwork,
        wdrCurrency === "Bank" || wdrCurrency === "PayPal" ? undefined : wdrAddress,
        wdrCurrency === "XRP" ? destinationTag : undefined,
        wdrCurrency === "Bank" ? { accountNumber, bankName, accountName, routingCode } : undefined,
        wdrCurrency === "PayPal" ? paypalEmail : undefined
      );

      if (res.success) {
        setWdrLog({ type: "success", message: res.message });
        setWdrAmountTxt("");
        setWdrAddress("");
        setDestinationTag("");
        setBankName("");
        setAccountNumber("");
        setAccountName("");
        setRoutingCode("");
        setPaypalEmail("");
      } else {
        setWdrLog({ type: "error", message: res.message });
      }
    } finally {
      setSubmittingWithdraw(false);
    }
  };

  const ledgerColumns: Column<(typeof user.transactions)[number]>[] = [
    {
      key: "id",
      header: "Tx ID",
      primary: true,
      cell: (t) => <span className="select-all font-data text-ink">{t.id}</span>,
    },
    { key: "date", header: "Date", cell: (t) => <span className="text-muted">{formatDateTime(t.date)}</span> },
    {
      key: "type",
      header: "Category",
      // Was: deposit → green, everything else → red. That painted investments
      // and payouts as failures.
      cell: (t) => (
        <Badge
          tone={
            t.type === "deposit"
              ? "positive"
              : t.type === "withdrawal"
                ? "negative"
                : t.type === "investment"
                  ? "accent"
                  : "neutral"
          }
        >
          {t.type}
        </Badge>
      ),
    },
    { key: "asset", header: "Asset", cell: (t) => t.asset || <span className="text-faint">—</span> },
    { key: "amount", header: "Amount", numeric: true, cell: (t) => formatMoney(t.amount) },
    {
      key: "status",
      header: "Status",
      align: "right",
      // Was: a green check on every row, including pending and rejected.
      cell: (t) => {
        const done = t.status === "completed" || t.status === "approved";
        const pending = t.status === "pending";
        return (
          <Badge tone={done ? "positive" : pending ? "warning" : "negative"}>
            {done ? <CheckCircle2 size={11} /> : pending ? <AlertTriangle size={11} /> : <XCircle size={11} />}
            {t.status}
          </Badge>
        );
      },
    },
  ];

  const isCryptoWithdrawal = wdrCurrency !== "Bank" && wdrCurrency !== "PayPal";

  return (
    <div className="space-y-4 pb-4 sm:pb-6">
      <header className="flex flex-col justify-between gap-4 border-b border-line pb-5 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2.5">
            <Wallet size={20} className="shrink-0 text-faint" aria-hidden="true" />
            <h1 className="text-2xl font-semibold tracking-tight text-ink">Wallet</h1>
          </div>
          <p className="mt-1 text-xs text-muted">
            Deposit funds, withdraw assets, and review your full transaction history.
          </p>
        </div>

        <div className="min-w-[180px] rounded-xl border border-line bg-surface px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-2xs font-semibold uppercase tracking-[0.09em] text-faint">
              Available balance
            </span>
            {/* Raw button: inline icon toggle beside a label; Button's smallest
                size (h-8 + padding) would break the row's baseline. */}
            <button
              type="button"
              onClick={() => setShowBalance(!showBalance)}
              className="rounded-sm p-0.5 text-faint transition-colors duration-[--duration-fast] hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent cursor-pointer"
              aria-label={showBalance ? "Hide balance" : "Show balance"}
              aria-pressed={!showBalance}
            >
              {showBalance ? <Eye size={13} /> : <EyeOff size={13} />}
            </button>
          </div>
          <strong className="mt-1 block font-data text-lg font-semibold tabular-nums text-ink">
            {showBalance ? formatMoney(user.balance) : "••••••"}
          </strong>
        </div>
      </header>

      <Tabs<WalletTab>
        variant="pill"
        layoutGroup="wallet"
        aria-label="Wallet sections"
        value={activeSubTab}
        onChange={setActiveSubTab}
        items={[
          { id: "deposit", label: <span className="flex items-center gap-1.5"><PlusSquare size={13} /> Deposit</span> },
          { id: "withdraw", label: <span className="flex items-center gap-1.5"><MinusSquare size={13} /> Withdraw</span> },
          { id: "ledger", label: <span className="flex items-center gap-1.5"><History size={13} /> History</span> },
        ]}
      />

      {/* ── Deposit ─────────────────────────────────────────────── */}
      {activeSubTab === "deposit" && (
        <div
          role="tabpanel"
          id="panel-deposit"
          aria-labelledby="tab-deposit"
          className="mx-auto w-full max-w-2xl"
        >
          <form onSubmit={handleDepositSubmit} className="space-y-4">
            {depositSuccessLog && (
              <Alert tone={depositSuccessLog.startsWith("Error") ? "error" : "success"}>
                {depositSuccessLog}
              </Alert>
            )}

            <SectionCard title="Choose an asset">
              {depositWalletOptions.length === 0 ? (
                <Alert tone="warning">No deposit wallets are currently enabled.</Alert>
              ) : (
                <ChoiceGrid
                  label="Select crypto"
                  value={selectedDepositLabel}
                  onChange={setDepositCurrency}
                  choices={depositWalletOptions.map(({ label }) => ({ value: label, label }))}
                />
              )}
            </SectionCard>

            <SectionCard title={`Send ${selectedDepositLabel}`}>
              <div className="space-y-4">
                <p className="text-xs leading-relaxed text-muted">
                  {selectedDepositWallet?.depositInstructions ||
                    "Deposit wallets are currently unavailable."}
                </p>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  {selectedQrCodeUrl && (
                    // The QR keeps a white plate in both themes — a QR
                    // inverted onto a dark surface fails to scan on a lot
                    // of phone cameras.
                    <div className="h-28 w-28 shrink-0 rounded-xl bg-white p-1.5">
                      <img
                        src={selectedQrCodeUrl}
                        alt={`${selectedDepositLabel} deposit address QR code`}
                        className="h-full w-full object-contain"
                      />
                    </div>
                  )}

                  <div className="min-w-0 flex-1 rounded-xl border border-line bg-panel p-3.5">
                    <span className="block text-2xs font-semibold uppercase tracking-[0.09em] text-faint">
                      Your {selectedDepositLabel} deposit address
                    </span>
                    <div className="mt-2 flex items-start justify-between gap-3">
                      <span className="min-w-0 select-all break-all font-data text-xs text-ink">
                        {selectedDepositWallet?.walletAddress || "No enabled wallet address available"}
                      </span>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={handleCopyAddr}
                        aria-label="Copy deposit address"
                        className="shrink-0"
                      >
                        {copiedAddress ? <Check size={14} className="text-positive" /> : <Copy size={14} />}
                      </Button>
                    </div>
                    <span aria-live="polite" className="sr-only">
                      {copiedAddress ? "Deposit address copied to clipboard" : ""}
                    </span>
                  </div>
                </div>

                {/*
                  XRP destination tag.

                  This panel previously displayed the literal tag "108253" to
                  every user, labelled "Your XRP Deposit Destination Tag
                  (Required)". `DepositWallet` has no tag field, so that
                  number was not anyone's tag — and on XRP the destination tag
                  is what attributes an incoming payment to an account.
                  Publishing one shared, invented tag risks unattributable or
                  lost deposits.

                  Until the deposit-wallet record carries a real per-account
                  tag, this fails safe: it says a tag is needed and routes the
                  user to support rather than showing a number we made up.
                */}
                {selectedDepositWallet?.coinName.toUpperCase() === "XRP" && (
                  <Alert tone="warning" title="A destination tag is required for XRP">
                    Contact support to get the destination tag for your account before sending XRP.
                    Sending without the correct tag can make a deposit impossible to credit.
                  </Alert>
                )}

                <ul className="space-y-1 text-2xs text-muted">
                  <li>Send only {selectedDepositLabel} to this address.</li>
                  <li>Assets are held 1:1.</li>
                </ul>
              </div>
            </SectionCard>

            <SectionCard title="Confirm your transfer">
              <div className="space-y-4">
                <Input
                  label="Deposit amount"
                  type="number"
                  required
                  numeric
                  prefix="$"
                  value={depositAmountTxt}
                  onChange={(e) => setDepositAmountTxt(e.target.value)}
                  placeholder="0.00"
                  hint={`Minimum ${formatMoney(selectedMinimumDeposit)}`}
                />

                <Input
                  label="Transaction hash (optional)"
                  type="text"
                  value={depositTxHash}
                  onChange={(e) => setDepositTxHash(e.target.value)}
                  placeholder="Blockchain transaction hash"
                  className="font-data"
                />

                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-muted">
                    Transaction screenshot (optional)
                  </span>
                  {/* Raw file input: sr-only and driven by its label/ref — Input
                      would render a visible field wrapper. */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    className="sr-only"
                    id="deposit-proof"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setDepositProofName(e.target.files[0].name);
                      }
                    }}
                  />
                  {/* A real <label> for the hidden input, so the drop zone is
                      keyboard-reachable and announced as a file control. The
                      previous div was mouse-only. */}
                  <label
                    htmlFor="deposit-proof"
                    className={
                      "flex cursor-pointer flex-col items-center gap-1 rounded-xl border-2 border-dashed px-4 py-5 text-center " +
                      "transition-colors duration-[--duration-fast] " +
                      "focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent " +
                      (depositProofName
                        ? "border-positive-line bg-positive-soft text-positive"
                        : "border-line bg-panel text-muted hover:border-accent-line")
                    }
                  >
                    {depositProofName ? (
                      <Check size={18} aria-hidden="true" />
                    ) : (
                      <ImageUp size={18} aria-hidden="true" />
                    )}
                    <span className="text-2xs font-medium">
                      {depositProofName ? "Receipt attached" : "Upload transfer receipt"}
                    </span>
                    <span className="break-all font-data text-2xs text-faint">
                      {depositProofName || "JPG or PNG, max 5MB"}
                    </span>
                  </label>
                </div>

                <div>
                  <Button type="submit" block size="lg" loading={submittingDeposit}>
                    Confirm deposit
                  </Button>
                  <p className="mt-2 text-center text-2xs text-muted">
                    Only confirm once you have actually sent the funds.
                  </p>
                </div>
              </div>
            </SectionCard>
          </form>
        </div>
      )}

      {/* ── Withdraw ────────────────────────────────────────────── */}
      {activeSubTab === "withdraw" && (
        <div
          role="tabpanel"
          id="panel-withdraw"
          aria-labelledby="tab-withdraw"
          className="mx-auto w-full max-w-2xl"
        >
          <form onSubmit={handleWithdrawSubmit} className="space-y-4">
            {wdrLog && <Alert tone={wdrLog.type === "error" ? "error" : "success"}>{wdrLog.message}</Alert>}

            <SectionCard title="Withdrawal method">
              <div className="space-y-4">
                <ChoiceGrid
                  label="Select method"
                  value={wdrCurrency}
                  onChange={setWdrCurrency}
                  choices={["USDT", "BTC", "ETH", "XRP", "SOL", "Bank", "PayPal"].map((coin) => ({
                    value: coin,
                    label: coin === "Bank" ? "Bank wire" : coin,
                  }))}
                />

                {wdrCurrency === "USDT" && (
                  <ChoiceGrid
                    label="USDT network"
                    columns="grid-cols-3"
                    value={wdrNetwork}
                    onChange={setWdrNetwork}
                    choices={["TRC20", "ERC20", "BEP20"].map((net) => ({ value: net, label: net }))}
                  />
                )}
              </div>
            </SectionCard>

            <SectionCard title="Amount and destination">
              <div className="space-y-4">
                <Input
                  label="Amount (USD)"
                  type="number"
                  required
                  numeric
                  prefix="$"
                  value={wdrAmountTxt}
                  onChange={(e) => setWdrAmountTxt(e.target.value)}
                  placeholder="0.00"
                  hint={`Available ${formatMoney(user.balance)}`}
                />

                {wdrCurrency === "PayPal" && (
                  <Input
                    label="PayPal email address"
                    type="email"
                    required
                    value={paypalEmail}
                    onChange={(e) => setPaypalEmail(e.target.value)}
                    placeholder="yourname@paypal.com"
                  />
                )}

                {wdrCurrency === "Bank" && (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Input
                      label="Bank name"
                      required
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="e.g. Chase Bank"
                    />
                    <Input
                      label="Account name"
                      required
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      placeholder="e.g. John Doe"
                    />
                    <Input
                      label="Account number"
                      required
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="e.g. 12345678"
                      hint="4–30 alphanumeric characters"
                    />
                    <Input
                      label="Routing / transit code"
                      required
                      value={routingCode}
                      onChange={(e) => setRoutingCode(e.target.value)}
                      placeholder="e.g. 021000021"
                      hint="4–15 alphanumeric characters"
                    />
                  </div>
                )}

                {isCryptoWithdrawal && (
                  <>
                    <Input
                      label="Withdrawal address"
                      required
                      value={wdrAddress}
                      onChange={(e) => setWdrAddress(e.target.value)}
                      placeholder={`External ${wdrCurrency} wallet address`}
                      className="font-data"
                    />

                    {wdrCurrency === "XRP" && (
                      <Input
                        label="XRP destination tag / memo"
                        required
                        value={destinationTag}
                        onChange={(e) => setDestinationTag(e.target.value)}
                        placeholder="e.g. 108253"
                        hint="Required. Enter 0 if your destination does not use one."
                      />
                    )}
                  </>
                )}
              </div>
            </SectionCard>

            <div>
              <Button type="submit" block size="lg" loading={submittingWithdraw}>
                Request withdrawal
              </Button>
              <p className="mt-2 px-4 text-center text-2xs leading-relaxed text-muted">
                Double-check the destination. Incorrect details can result in permanent loss of funds.
              </p>
            </div>
          </form>
        </div>
      )}

      {/* ── History ─────────────────────────────────────────────── */}
      {activeSubTab === "ledger" && (
        <div role="tabpanel" id="panel-ledger" aria-labelledby="tab-ledger">
          <SectionCard flush title="Transaction history">
            <div className="p-3 sm:p-0">
              <DataTable
                caption="All deposits, withdrawals and transfers"
                columns={ledgerColumns}
                rows={user.transactions}
                rowKey={(t) => t.id}
                className="sm:[&>div]:rounded-none sm:[&>div]:border-0"
                empty={{
                  icon: History,
                  title: "No transactions yet",
                  description: "Deposits and withdrawals will appear here once you make one.",
                  action: (
                    <Button size="sm" icon={PlusSquare} onClick={() => setActiveSubTab("deposit")}>
                      Make a deposit
                    </Button>
                  ),
                }}
              />
            </div>
          </SectionCard>
        </div>
      )}
    </div>
  );
};
