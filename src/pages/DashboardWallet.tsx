import React, { useEffect, useMemo, useState, useRef } from "react";
import { useUser } from "@clerk/clerk-react";
import { useApp } from "../context/AppContext";
import { useSupabaseClient, uploadDepositProof } from "../lib/supabase";
import { getDepositWalletLabel } from "../services";
import { 
  PlusSquare,
  MinusSquare,
  History,
  Copy,
  Check,
  Sparkles,
  Search,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Download,
  Info,
  Wallet,
  Eye,
  EyeOff
} from "lucide-react";
import { formatDateTime } from "../lib/format";

interface DashboardWalletProps {
  initialOpenTab?: "deposit" | "withdraw" | "ledger";
}

export const DashboardWallet: React.FC<DashboardWalletProps> = ({ initialOpenTab = "deposit" }) => {
  const { user, deposit, withdraw, enabledDepositWallets, addNotification } = useApp();
  const { user: clerkUser } = useUser();
  const supabase = useSupabaseClient();
  const [activeSubTab, setActiveSubTab] = useState<"deposit" | "withdraw" | "ledger">(initialOpenTab);
  const [showBalance, setShowBalance] = useState(true);

  // Deposit states
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [depositCurrency, setDepositCurrency] = useState("USDT ERC20");
  const [depositAmountTxt, setDepositAmountTxt] = useState("");
  const [depositTxHash, setDepositTxHash] = useState("");
  const [depositProofName, setDepositProofName] = useState("");
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [depositSuccessLog, setDepositSuccessLog] = useState<string | null>(null);

  const depositWalletOptions = useMemo(
    () => enabledDepositWallets.map(wallet => ({ wallet, label: getDepositWalletLabel(wallet) })),
    [enabledDepositWallets]
  );
  const selectedDepositWallet = depositWalletOptions.find(option => option.label === depositCurrency)?.wallet || depositWalletOptions[0]?.wallet;
  const selectedDepositLabel = selectedDepositWallet ? getDepositWalletLabel(selectedDepositWallet) : depositCurrency;
  const selectedMinimumDeposit = selectedDepositWallet?.minimumDeposit || 0;
  const selectedQrCodeUrl = selectedDepositWallet?.qrCodeUrl || (selectedDepositWallet?.walletAddress ? `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(selectedDepositWallet.walletAddress)}` : "");

  useEffect(() => {
    if (depositWalletOptions.length === 0) return;
    if (!depositWalletOptions.some(option => option.label === depositCurrency)) {
      setDepositCurrency(depositWalletOptions[0].label);
    }
  }, [depositCurrency, depositWalletOptions]);

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDepositSuccessLog(null);

    if (!selectedDepositWallet) {
      triggerDepositFeedback("Error: No enabled deposit wallet is currently available.");
      return;
    }

    const amount = parseFloat(depositAmountTxt);
    if (!amount || amount < selectedMinimumDeposit) {
      triggerDepositFeedback(`Error: The minimum deposit amount is $${selectedMinimumDeposit.toLocaleString()} equivalent.`);
      return;
    }

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
      triggerDepositFeedback(`Successfully submitted! Mapped $${amount} ${selectedDepositLabel} secure deposit pending verification. ${depositTxHash.trim() ? "Transaction Hash registered." : ""}`);
    } else {
      triggerDepositFeedback("Error occurred while processing deposit.");
    }
  };

  const handleCopyAddr = () => {
    if (!selectedDepositWallet?.walletAddress) return;
    navigator.clipboard.writeText(selectedDepositWallet.walletAddress);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const triggerDepositFeedback = (msg: string) => {
    setDepositSuccessLog(msg);
    setTimeout(() => setDepositSuccessLog(null), 7000);
  };

  // Withdraw states
  const [wdrCurrency, setWdrCurrency] = useState("USDT");
  const [wdrNetwork, setWdrNetwork] = useState("TRC20");
  const [wdrAmountTxt, setWdrAmountTxt] = useState("");
  const [wdrAddress, setWdrAddress] = useState("");
  const [wdrLog, setWdrLog] = useState<{ type: "success" | "error"; message: string } | null>(null);

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
  };

  return (
    <div className="space-y-4 pb-4 sm:pb-6 font-sans">
      
      {/* Page Header */}
      <div className="border-b border-line/50 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-ink">
            <Wallet size={24} className="text-ink shrink-0" />
            <h1 className="text-2xl font-bold font-heading">Wallet</h1>
          </div>
          <p className="text-xs text-muted mt-1 font-sans">
            Deposit funds, withdraw assets, view history, or contact support instantly.
          </p>
        </div>

        <div className="bg-surface border border-line rounded-xl px-4 py-3 font-subheading text-xs text-right min-w-[160px]">
          <div className="flex items-center justify-end gap-1.5 text-muted">
            <button 
              type="button"
              onClick={() => setShowBalance(!showBalance)} 
              className="text-muted hover:text-ink focus:outline-none transition-colors cursor-pointer"
              title={showBalance ? "Hide balance" : "Show balance"}
            >
              {showBalance ? <Eye size={12} /> : <EyeOff size={12} />}
            </button>
            <span className="text-2xs uppercase select-none">Available Balance</span>
          </div>
          <strong className="text-accent block text-sm font-data mt-0.5">
            {showBalance ? `$${user.balance.toLocaleString()}` : "••••••"}
          </strong>
        </div>
      </div>

      {/* Navigation Layout Tabs */}
      <div className="flex bg-surface border border-line/80 rounded-xl p-1.5 w-fit font-sans">
        <button
          onClick={() => setActiveSubTab("deposit")}
          className={`flex items-center gap-1.5 px-4 sm:px-6 py-2 rounded-lg text-xs font-bold font-subheading transition-all cursor-pointer ${
            activeSubTab === "deposit" ? "bg-accent text-ground" : "text-muted hover:text-ink"
          }`}
        >
          <PlusSquare size={14} /> Deposit
        </button>
        <button
          onClick={() => setActiveSubTab("withdraw")}
          className={`flex items-center gap-1.5 px-4 sm:px-6 py-2 rounded-lg text-xs font-bold font-subheading transition-all cursor-pointer ${
            activeSubTab === "withdraw" ? "bg-accent text-ground" : "text-muted hover:text-ink"
          }`}
        >
          <MinusSquare size={14} /> Withdraw
        </button>
        <button
          onClick={() => setActiveSubTab("ledger")}
          className={`flex items-center gap-1.5 px-4 sm:px-6 py-2 rounded-lg text-xs font-bold font-subheading transition-all cursor-pointer ${
            activeSubTab === "ledger" ? "bg-accent text-ground" : "text-muted hover:text-ink"
          }`}
        >
          <History size={14} /> History
        </button>
      </div>

      {/* Main interactive Tab panels */}
      <div className="bg-surface border border-line rounded-2xl p-4 shadow-2xl overflow-hidden min-h-[340px] font-sans">
        
        {/* TAB 1: DEPOSIT ASSETS */}
        {activeSubTab === "deposit" && (
          <div className="max-w-xl mx-auto w-full">
            
            {/* Input form */}
            <form onSubmit={handleDepositSubmit} className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-ink">Deposit</h3>
                <p className="text-xs text-muted mt-1">Select currency and enter deposit amount.</p>
              </div>

              {depositSuccessLog && (
                <div className={`p-4 text-xs font-semibold rounded-xl border font-sans ${
                  depositSuccessLog.startsWith("Error") ? "bg-negative/10 border-negative/30 text-negative" : "bg-positive/10 border-positive/30 text-positive"
                }`}>
                  {depositSuccessLog}
                </div>
              )}

              {/* Currency selectors */}
              <div className="space-y-4">
                <div className="flex items-center gap-1.5 text-2xs uppercase font-subheading tracking-wider text-muted">
                  <Download size={13} className="text-accent shrink-0" />
                  <span>Select Crypto</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                  {depositWalletOptions.map(({ label }) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => {
                        setDepositCurrency(label);
                      }}
                      className={`p-2 py-2.5 rounded-lg border text-center text-2xs font-bold font-data cursor-pointer transition-all ${
                        selectedDepositLabel === label 
                          ? "border-accent bg-accent/10 text-accent" 
                          : "border-line bg-ground/50 text-muted"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {depositWalletOptions.length === 0 && (
                  <p className="text-xs text-muted">No deposit wallets are currently enabled.</p>
                )}
              </div>

              {/* Repositioned: DEPOSIT INSTRUCTIONS address card */}
              <div className="bg-panel/60 border border-line rounded-xl p-4.5 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-accent uppercase tracking-wider font-heading">
                  <Info size={14} className="text-accent shrink-0" />
                  <span>Deposit Instructions</span>
                </div>
                
                <p className="text-xs text-muted leading-relaxed font-sans font-medium">
                  {selectedDepositWallet?.depositInstructions || "Deposit wallets are currently unavailable."}
                </p>

                {selectedQrCodeUrl && (
                  <div className="w-24 h-24 bg-white p-1 rounded-xl">
                    <img src={selectedQrCodeUrl} alt={`${selectedDepositLabel} deposit QR code`} className="w-full h-full object-contain" />
                  </div>
                )}

                {/* Secure Key panel */}
                <div className="p-3.5 rounded-xl border border-line bg-ground space-y-2 font-sans">
                  <span className="text-2xs uppercase tracking-normal text-muted font-subheading block">Your {selectedDepositLabel} Deposit Address</span>
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="text-ink font-semibold select-all break-all pr-2 font-data">
                      {selectedDepositWallet?.walletAddress || "No enabled wallet address available"}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyAddr}
                      className="p-1.5 rounded bg-surface border border-line hover:border-accent hover:text-accent transition-all shrink-0 cursor-pointer flex items-center justify-center"
                    >
                      {copiedAddress ? <Check size={14} className="text-positive" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>

                {/* Optional XRP Destination Tag Box */}
                {selectedDepositWallet?.coinName.toUpperCase() === "XRP" && (
                  <div className="p-3.5 rounded-xl border border-line bg-ground space-y-2 font-sans animate-fadeIn">
                    <span className="text-2xs uppercase tracking-normal text-muted font-subheading block">Your XRP Deposit Destination Tag / Memo (Required)</span>
                    <div className="flex items-center justify-between gap-3 text-xs">
                      <span className="text-ink font-mono font-bold select-all bg-panel px-2 py-0.5 rounded border border-line">
                        108253
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText("108253");
                          addNotification("Copied XRP Destination Tag: 108253");
                        }}
                        className="p-1.5 px-3 rounded bg-surface border border-line hover:border-accent hover:text-accent transition-all shrink-0 cursor-pointer flex items-center justify-center text-2xs text-ink font-semibold"
                      >
                        Copy Tag
                      </button>
                    </div>
                  </div>
                )}

                <div className="text-2xs text-muted italic space-y-0.5 font-sans">
                  <span>• Ensure you send only {depositCurrency} to this address.</span>
                  <span className="block">• Assets are safely held 1:1.</span>
                </div>
              </div>

              {/* Deposit Amount input (repositioned immediately below address card) */}
              <div className="space-y-1.5 font-sans">
                <label className="text-2xs uppercase font-subheading tracking-wider text-muted block">Deposit Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted font-bold font-data">$</span>
                  <input
                    type="number"
                    required
                    value={depositAmountTxt}
                    onChange={(e) => setDepositAmountTxt(e.target.value)}
                    placeholder={`Min. Deposit: ${selectedMinimumDeposit.toLocaleString()} USD`}
                    className="w-full bg-ground border border-line focus:border-accent rounded-xl pl-8 pr-4 py-2.5 text-xs text-ink font-bold font-data placeholder:text-2xs placeholder:font-medium"
                  />
                </div>
              </div>

              {/* Transaction Hash (TxID) input (pushed as part of the absolute bottom fields) */}
              <div className="space-y-1.5 font-sans">
                <label className="text-2xs uppercase font-subheading tracking-wider text-muted block">Transaction Hash (Optional)</label>
                <input
                  type="text"
                  value={depositTxHash}
                  onChange={(e) => setDepositTxHash(e.target.value)}
                  placeholder="Blockchain validation hash / transaction index"
                  className="w-full bg-ground border border-line focus:border-accent rounded-xl px-4 py-2.5 text-xs text-ink font-mono placeholder:text-2xs placeholder:font-normal"
                />
              </div>

              {/* Transaction Screenshot (Optional) with native image gallery selection */}
              <div className="space-y-2 font-sans">
                <label className="text-2xs uppercase font-subheading tracking-wider text-muted block">Transaction Screenshot (Optional)</label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setDepositProofName(e.target.files[0].name);
                    }
                  }}
                  className="hidden"
                />
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                    depositProofName 
                      ? "border-positive/50 bg-positive/5 text-positive" 
                      : "border-line bg-ground hover:border-accent"
                  }`}
                >
                  <p className="text-2xs font-sans font-medium">
                    {depositProofName ? "✓ Receipt Proof Attached" : "📸 Upload transfer receipt or block explorer snapshot"}
                  </p>
                  <span className="text-2xs text-faint font-mono block mt-1">
                    {depositProofName || "Supports JPG, PNG (Max size: 5MB)"}
                  </span>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-accent to-accent-deep text-ground font-bold font-subheading text-xs uppercase shadow transition-all transform hover:-translate-y-0.5 cursor-pointer text-center"
                >
                  Confirm Deposit
                </button>
                <p className="text-xs text-muted text-center mt-2 font-sans">
                  Please only click the Confirm Deposit button if you have already transferred the funds.
                </p>
              </div>
            </form>

          </div>
        )}

        {/* TAB 2: WITHDRAW SECURITIES */}
        {activeSubTab === "withdraw" && (
          <form onSubmit={handleWithdrawSubmit} className="max-w-xl mx-auto space-y-6 font-sans">
            <div>
              <h3 className="text-sm font-bold font-heading text-ink">Withdraw Assets</h3>
              <p className="text-xs text-muted mt-1 font-sans">Withdraw your assets to external addresses.</p>
            </div>

            {wdrLog && (
              <div className={`p-4 text-xs font-semibold rounded-xl border font-sans ${
                wdrLog.type === "error" ? "bg-negative/10 border-negative/30 text-negative" : "bg-positive/10 border-positive/30 text-positive"
              }`}>
                {wdrLog.message}
              </div>
            )}

            {/* Denomination Coin selection */}
            <div className="space-y-1.5">
              <label className="text-2xs uppercase font-subheading tracking-wider text-muted">Select Withdrawal Method</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 font-data">
                {["USDT", "BTC", "ETH", "XRP", "SOL", "Bank", "PayPal"].map((coin) => (
                  <button
                    key={coin}
                    type="button"
                    onClick={() => setWdrCurrency(coin)}
                    className={`p-2 py-2.5 rounded-lg border text-center text-2xs font-bold cursor-pointer transition-all ${
                      wdrCurrency === coin 
                        ? "border-accent bg-accent/10 text-accent" 
                        : "border-line bg-ground/50 text-muted"
                    }`}
                  >
                    {coin === "Bank" ? "Bank Wire" : coin === "PayPal" ? "PayPal" : coin}
                  </button>
                ))}
              </div>
            </div>

            {wdrCurrency === "USDT" && (
              <div className="space-y-1.5 animate-fadeIn">
                <label className="text-2xs uppercase font-subheading tracking-wider text-muted">Select USDT Network</label>
                <div className="grid grid-cols-3 gap-3 font-data">
                  {["TRC20", "ERC20", "BEP20"].map((net) => (
                    <button
                      key={net}
                      type="button"
                      onClick={() => setWdrNetwork(net)}
                      className={`p-2.5 rounded-lg border text-center text-xs font-bold cursor-pointer transition-all ${
                        wdrNetwork === net 
                          ? "border-accent bg-accent/10 text-accent" 
                          : "border-line bg-ground/50 text-muted"
                      }`}
                    >
                      {net}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Wallet Cash limit checking */}
            <div className="space-y-1.5 font-sans">
              <div className="flex justify-between text-2xs uppercase text-muted font-subheading">
                <span>Amount (USD)</span>
                <span className="font-data">Available Balance: ${user.balance.toLocaleString()}</span>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted font-bold font-data">$</span>
                <input
                  type="number"
                  required
                  value={wdrAmountTxt}
                  onChange={(e) => setWdrAmountTxt(e.target.value)}
                  placeholder="Enter withdraw amount"
                  className="w-full bg-ground border border-line focus:border-accent rounded-xl pl-8 pr-4 py-2 text-xs text-ink font-bold font-data"
                />
              </div>
            </div>

            {/* Conditional input fields based on payout method */}
            {wdrCurrency === "PayPal" && (
              <div className="space-y-1.5 animate-fadeIn font-sans">
                <label className="text-2xs uppercase font-subheading tracking-wider text-muted">PayPal Email Address</label>
                <input
                  type="email"
                  required
                  value={paypalEmail}
                  onChange={(e) => setPaypalEmail(e.target.value)}
                  placeholder="e.g., yourname@paypal.com"
                  className="w-full bg-ground border border-line focus:border-accent rounded-lg py-2 px-3 text-xs text-ink focus:outline-none"
                />
              </div>
            )}

            {wdrCurrency === "Bank" && (
              <div className="space-y-3.5 animate-fadeIn font-sans">
                <h4 className="text-2xs font-bold font-subheading uppercase text-accent tracking-wider">Local Bank Settlement Fields</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <label className="text-2xs uppercase font-subheading tracking-wider text-muted">Bank Name</label>
                    <input
                      type="text"
                      required
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="e.g., Chase Bank"
                      className="w-full bg-ground border border-line focus:border-accent rounded-lg py-2.5 px-3 text-xs text-ink focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-2xs uppercase font-subheading tracking-wider text-muted">Account Name</label>
                    <input
                      type="text"
                      required
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      placeholder="e.g., John Doe"
                      className="w-full bg-ground border border-line focus:border-accent rounded-lg py-2.5 px-3 text-xs text-ink focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-2xs uppercase font-subheading tracking-wider text-muted">Account Number</label>
                    <input
                      type="text"
                      required
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="e.g., 12345678"
                      className="w-full bg-ground border border-line focus:border-accent rounded-lg py-2.5 px-3 text-xs text-ink focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-2xs uppercase font-subheading tracking-wider text-muted">Routing / Transit Code</label>
                    <input
                      type="text"
                      required
                      value={routingCode}
                      onChange={(e) => setRoutingCode(e.target.value)}
                      placeholder="e.g., 021000021"
                      className="w-full bg-ground border border-line focus:border-accent rounded-lg py-2.5 px-3 text-xs text-ink focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {wdrCurrency !== "Bank" && wdrCurrency !== "PayPal" && (
              <div className="space-y-3.5 animate-fadeIn font-sans">
                <div className="space-y-1.5">
                  <label className="text-2xs uppercase font-subheading tracking-wider text-muted">Withdrawal Address</label>
                  <input
                    type="text"
                    required
                    value={wdrAddress}
                    onChange={(e) => setWdrAddress(e.target.value)}
                    placeholder={`Enter external ${wdrCurrency} crypto wallet address`}
                    className="w-full bg-ground border border-line focus:border-accent rounded-lg py-2.5 px-3 text-xs text-ink focus:outline-none"
                  />
                </div>

                {wdrCurrency === "XRP" && (
                  <div className="space-y-1.5 animate-fadeIn">
                    <label className="text-2xs uppercase font-subheading tracking-wider text-muted">XRP Destination Tag / Memo</label>
                    <input
                      type="text"
                      required
                      value={destinationTag}
                      onChange={(e) => setDestinationTag(e.target.value)}
                      placeholder="Required. Enter up to 10-digit number, e.g. 108253"
                      className="w-full bg-ground border border-line focus:border-accent rounded-lg py-2.5 px-3 text-xs text-ink focus:outline-none"
                    />
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2.5">
              <button
                type="submit"
                className="w-full py-3.5 bg-ground border border-accent text-accent hover:bg-accent hover:text-ground font-bold font-subheading text-xs uppercase rounded-xl transition-all transform hover:-translate-y-0.5 cursor-pointer"
              >
                Withdraw
              </button>
              <p className="text-xs text-muted text-center mt-2 font-sans select-none px-4 leading-normal">
                Please ensure your settlement coordinates are flawless. Incorrect instructions will result in permanent loss or queue rejection.
              </p>
            </div>
          </form>
        )}

        {/* TAB 3: MASTER TRANSACTION AUDITOR */}
        {activeSubTab === "ledger" && (
          <div className="space-y-4 font-sans">
            <div>
              <h3 className="text-sm font-bold font-heading text-ink">Transaction History</h3>
              <p className="text-xs text-muted mt-1 font-sans">View all past deposits and withdrawals.</p>
            </div>

            {user.transactions.length === 0 ? (
              <p className="text-xs text-center text-muted py-16 font-sans">No transactions yet.</p>
            ) : (
              <div className="overflow-x-auto text-sans">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-line text-2xs uppercase font-subheading tracking-wider text-muted bg-ground/40">
                      <th className="p-3 pl-4">TxID</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Asset</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3 pr-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line/30 font-data">
                    {user.transactions.map((t) => (
                      <tr key={t.id} className="hover:bg-panel/50 transition-colors">
                        <td className="p-3 pl-4 font-bold text-ink select-all">{t.id}</td>
                        <td className="p-3 text-muted font-sans">{formatDateTime(t.date)}</td>
                        <td className="p-3 uppercase font-semibold font-sans">
                          <span className={`px-2 py-0.5 rounded text-2xs ${
                            t.type === "deposit" ? "bg-positive/10 text-positive" : "bg-negative/10 text-negative"
                          }`}>
                            {t.type}
                          </span>
                        </td>
                        <td className="p-3 font-semibold text-ink font-data">{t.asset}</td>
                        <td className="p-3 text-ink font-bold">${t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className="p-3 pr-4 text-right">
                          <span className={`text-2xs font-bold flex items-center justify-end gap-1 font-subheading ${
                            t.status === "completed" || t.status === "approved" ? "text-positive" :
                            t.status === "pending" ? "text-yellow-400" :
                            "text-negative"
                          }`}>
                            <CheckCircle2 size={12} /> {t.status.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}


      </div>

    </div>
  );
};
