import React, { useState, useEffect, useMemo } from "react";
import { useSession } from "../context/domains/SessionContext";
import { useWallet } from "../context/domains/WalletContext";
import { getDepositWalletLabel } from "../services";
import { X, Check, Copy, ArrowUpRight, Loader2, Info, AlertTriangle } from "lucide-react";
import { Alert, Button, Input, Modal } from "./ui";

interface GlobalModalsProps {
  depositModalOpen: boolean;
  setDepositModalOpen: (open: boolean) => void;
  withdrawModalOpen: boolean;
  setWithdrawModalOpen: (open: boolean) => void;
  onNavigate: (view: string) => void;
}

export function GlobalModals({
  depositModalOpen, setDepositModalOpen,
  withdrawModalOpen, setWithdrawModalOpen,
  onNavigate
}: GlobalModalsProps) {
  const { user } = useSession();
  const { deposit, withdraw, enabledDepositWallets, insufficientBalanceOpen, setInsufficientBalanceOpen } = useWallet();

  // Form states inside Quick Modals
  const [depAmt, setDepAmt] = useState("");
  const [depCoin, setDepCoin] = useState("USDT");
  const [depNetwork, setDepNetwork] = useState("TRC20");
  const [copied, setCopied] = useState(false);
  const [depTxHash, setDepTxHash] = useState("");
  const [depProofName, setDepProofName] = useState("");
  const [wdrAmt, setWdrAmt] = useState("");
  const [wdrCoin, setWdrCoin] = useState("USDT");
  const [wdrNetwork, setWdrNetwork] = useState("TRC20");
  const [wdrAddr, setWdrAddr] = useState("");

  const [modalFeedback, setModalFeedback] = useState<string | { title: string; description: string; type?: string } | null>(null);

  // Scroll locking now belongs to each <Modal>; a second lock here caused
  // the leak documented in useBodyScrollLock.

  const depositCoins = useMemo(
    () => Array.from(new Set(enabledDepositWallets.map(wallet => wallet.coinName).filter(Boolean))),
    [enabledDepositWallets]
  );
  const depositNetworks = useMemo(
    () => enabledDepositWallets.filter(wallet => wallet.coinName === depCoin),
    [depCoin, enabledDepositWallets]
  );
  const selectedDepositWallet = depositNetworks.find(wallet => wallet.network === depNetwork) || depositNetworks[0] || enabledDepositWallets[0];
  const selectedDepositLabel = selectedDepositWallet ? getDepositWalletLabel(selectedDepositWallet) : "";
  const selectedDepositQrCodeUrl = selectedDepositWallet?.qrCodeUrl || (
    selectedDepositWallet?.walletAddress
      ? `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(selectedDepositWallet.walletAddress)}`
      : ""
  );

  useEffect(() => {
    if (depositCoins.length === 0) return;
    if (!depositCoins.includes(depCoin)) {
      setDepCoin(depositCoins[0]);
    }
  }, [depCoin, depositCoins]);

  useEffect(() => {
    if (depositNetworks.length === 0) return;
    if (!depositNetworks.some(wallet => wallet.network === depNetwork)) {
      setDepNetwork(depositNetworks[0].network);
    }
  }, [depNetwork, depositNetworks]);

  useEffect(() => {
    if (wdrCoin === "USDT") {
      setWdrNetwork("TRC20");
    } else if (wdrCoin === "BTC") {
      setWdrNetwork("BTC");
    } else if (wdrCoin === "ETH") {
      setWdrNetwork("ERC20");
    } else if (wdrCoin === "USD") {
      setWdrNetwork("ACH");
    }
  }, [wdrCoin]);

  const getNetworksForWdrCoin = (coin: string) => {
    switch (coin) {
      case "USDT":
        return [
          { id: "TRC20", label: "TRC20 (Tron Network)" },
          { id: "ERC20", label: "ERC20 (Ethereum Network)" },
          { id: "BEP20", label: "BEP20 (BNB Smart Chain)" }
        ];
      case "BTC":
        return [
          { id: "BTC", label: "Bitcoin Native Network (BTC)" }
        ];
      case "ETH":
        return [
          { id: "ERC20", label: "ERC20 (Ethereum Network)" }
        ];
      case "USD":
        return [
          { id: "ACH", label: "Bank ACH (Transit / Checking)" },
          { id: "WIRE", label: "International Wire Transfer" }
        ];
      default:
        return [
          { id: "TRC20", label: "TRC20 Network" }
        ];
    }
  };

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const triggerModalFeedback = (msg: string | { title: string; description: string; type?: string }) => {
    setModalFeedback(msg);
  };

  const handleQuickDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(depAmt);
    if (!amount || amount <= 0) return;
    if (!selectedDepositWallet) {
      triggerModalFeedback("Error: No enabled deposit wallet is currently available.");
      return;
    }
    if (amount < selectedDepositWallet.minimumDeposit) {
      triggerModalFeedback(`Error: Minimum deposit is ${selectedDepositWallet.minimumDeposit.toLocaleString()} USD.`);
      return;
    }

    await deposit(amount, selectedDepositLabel, depTxHash.trim() || "N/A", depProofName || "payment_proof_receipt.jpg");
    setDepAmt("");
    setDepTxHash("");
    setDepProofName("");
    triggerModalFeedback({
      title: "Deposit Processing",
      description: `Your deposit of $${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} USD equivalent of ${selectedDepositLabel} is being processed. The funds will be credited to your account after network confirmation.`,
      type: "success"
    });
    setTimeout(() => {
      setDepositModalOpen(false);
      setModalFeedback(null);
    }, 5000);
  };

  const handleQuickWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(wdrAmt);
    if (!amount || amount <= 0 || !wdrAddr.trim()) return;

    if (!user.isLoggedIn) {
      setWithdrawModalOpen(false);
      onNavigate("auth");
      return;
    }

    const currencyLabel = wdrCoin === "USD" ? "USD" : `${wdrCoin} (${wdrNetwork})`;
    const res = await withdraw(amount, currencyLabel, wdrAddr);
    if (res.success) {
      setWdrAmt("");
      setWdrAddr("");
      triggerModalFeedback({
        title: "Withdrawal Submitted",
        description: `Your request to withdraw $${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} USD equivalent in ${currencyLabel} to ${wdrAddr} has been safely queued. Settlement is currently processing.`,
        type: "success"
      });
      setTimeout(() => {
        setWithdrawModalOpen(false);
        setModalFeedback(null);
      }, 5000);
    } else {
      if (res.message.toLowerCase().includes("insufficient") || res.message.toLowerCase().includes("not enough")) {
        setWithdrawModalOpen(false);
        setInsufficientBalanceOpen(true);
      } else {
        triggerModalFeedback(`Error: ${res.message}`);
      }
    }
  };

  return (
    <>
      {/* QUICK DEPOSIT MODAL OUTLAY */}
      <Modal
        open={depositModalOpen}
        onClose={() => { setDepositModalOpen(false); setModalFeedback(null); }}
        title="Fast deposit"
        description="Fund your wallet to begin trading. Select your asset and network."
      >
        <div className="space-y-5">

              {modalFeedback && (() => {
                if (typeof modalFeedback === "object") {
                  return (
                    <div className="p-4 rounded-xl bg-surface border border-positive/20 flex items-start gap-3 text-positive">
                      <div className="shrink-0 mt-0.5">
                        <Loader2 size={16} className="animate-spin text-positive" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-ink leading-tight">
                          {modalFeedback.title}
                        </h4>
                        <p className="text-xs text-positive/85 leading-relaxed font-sans">
                          {modalFeedback.description}
                        </p>
                      </div>
                    </div>
                  );
                }
                return (
                  <div className={`p-3 text-xs rounded-lg text-center ${
                    modalFeedback.startsWith("Error") 
                      ? "bg-negative/10 border-negative/30 text-negative" 
                      : "bg-positive/10 border-positive/30 text-positive font-semibold"
                  }`}>
                    {modalFeedback}
                  </div>
                );
              })()}

              <form onSubmit={handleQuickDeposit} className="space-y-5">
                {/* Step 1: Coin Selection */}
                <div className="space-y-1.5">
                  <label className="text-2xs text-muted font-sans uppercase font-bold tracking-wider block">Coin</label>
                  <div className="grid grid-cols-3 gap-2 text-xs font-bold font-sans">
                    {depositCoins.map(coin => (
                      <button
                        key={coin}
                        type="button"
                        onClick={() => setDepCoin(coin)}
                        className={`py-2 rounded-xl border text-center cursor-pointer transition-all ${
                          depCoin === coin 
                            ? "border-accent bg-accent/10 text-accent" 
                            : "border-line/50 bg-surface text-muted"
                        }`}
                      >
                        {coin}
                      </button>
                    ))}
                  </div>
                  {depositCoins.length === 0 && (
                    <p className="text-xs text-muted">No deposit wallets are currently enabled.</p>
                  )}
                </div>

                {/* Step 2: Blockchain Network Selection */}
                {depositNetworks.length > 0 && (
                <div className="space-y-1.5">
                  <label className="text-2xs text-muted font-sans uppercase font-bold tracking-wider block">Blockchain Network</label>
                  <div className="flex flex-wrap gap-2 text-2xs font-bold font-sans">
                    {depositNetworks.map((wallet) => (
                      <button
                        key={wallet.id}
                        type="button"
                        onClick={() => setDepNetwork(wallet.network)}
                        className={`px-3 py-1.5 rounded-xl border text-center transition-all cursor-pointer ${
                          selectedDepositWallet?.id === wallet.id
                            ? "border-accent bg-accent/10 text-accent font-extrabold" 
                            : "border-line/50 bg-surface text-muted"
                        }`}
                      >
                        {wallet.network}
                      </button>
                    ))}
                  </div>
                </div>
                )}

                {/* Step 3: Address / QR display */}
                <div className="space-y-3 pt-1">
                  <div className="flex gap-4 items-center">
                    {selectedDepositQrCodeUrl && (
                      <div className="w-24 h-24 bg-white p-1 rounded-xl shrink-0">
                        <img 
                          src={selectedDepositQrCodeUrl}
                          alt={`${selectedDepositLabel} deposit QR code`}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}

                    <div className="flex-1 min-w-0 space-y-1.5 text-left">
                      <span className="text-2xs text-muted font-sans uppercase block font-bold tracking-wider">
                        YOUR {selectedDepositLabel || "CRYPTO"} DEPOSIT ADDRESS
                      </span>
                      <div className="bg-surface border border-line/50 rounded-xl p-2 flex items-center justify-between gap-1.5">
                        <span className="font-mono text-2xs break-all select-all text-ink pr-1">
                          {selectedDepositWallet?.walletAddress || "No enabled wallet address available"}
                        </span>
                        {selectedDepositWallet?.walletAddress && (
                          <button
                            type="button"
                            onClick={() => handleCopyAddress(selectedDepositWallet.walletAddress)}
                            className="p-1 px-1.5 rounded-lg bg-line/50 hover:bg-accent/10 text-muted hover:text-accent transition-all cursor-pointer select-none shrink-0"
                            title="Copy Address"
                          >
                            {copied ? (
                              <span className="text-2xs text-positive font-bold flex items-center gap-1">
                                <Check size={10} /> COPIED
                              </span>
                            ) : (
                              <Copy size={11} />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-2xs text-muted italic space-y-0.5 text-left font-sans">
                    <span>{selectedDepositWallet?.depositInstructions || "Deposit wallets are currently unavailable."}</span>
                  </div>
                </div>

                {/* Deposit Amount input */}
                <div className="space-y-1 text-left">
                  <label className="text-2xs text-muted font-sans uppercase block font-bold tracking-wider">
                    AMOUNT OF DEPOSIT (USD VALUE)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min={selectedDepositWallet?.minimumDeposit || 0}
                      value={depAmt}
                      onChange={(e) => setDepAmt(e.target.value)}
                      placeholder={`Min. Deposit: ${(selectedDepositWallet?.minimumDeposit || 0).toLocaleString()} USD`}
                      className="w-full bg-surface border border-line/80 focus:border-accent focus:ring-1 focus:ring-accent rounded-xl py-2.5 px-3 text-2xs text-ink font-mono font-semibold transition-all focus:outline-none placeholder:text-2xs placeholder-slate-500"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-2xs text-muted font-mono font-bold">
                      USD
                    </span>
                  </div>
                </div>

                <div className="pt-1 select-none">
                  <p className="text-2xs text-muted flex items-start gap-1.5 leading-relaxed text-left">
                    <Info size={11} className="text-warning shrink-0 mt-0.5" />
                    <span>Minimum deposit: {(selectedDepositWallet?.minimumDeposit || 0).toLocaleString()} USD. Deposits below this amount cannot be recovered.</span>
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={!selectedDepositWallet}
                    className="w-full py-3.5 bg-accent hover:opacity-95 disabled:opacity-50 text-ground font-extrabold font-heading text-xs uppercase rounded-xl transition-all shadow-md shadow-accent/10 cursor-pointer tracking-wider text-center"
                  >
                    CONFIRM DEPOSIT
                  </button>
                  <p className="text-xs text-muted text-center mt-2 font-sans">
                    Please only click the Confirm Deposit button if you have already transferred the funds.
                  </p>
                </div>
              </form>
        </div>
      </Modal>

      {/* QUICK WITHDRAWAL MODAL OUTLAY */}
      <Modal
        open={withdrawModalOpen}
        onClose={() => { setWithdrawModalOpen(false); setModalFeedback(null); }}
        title="Withdraw"
        description="Make sure the address and network match exactly — a mismatch can permanently lose the funds."
      >
        <div className="space-y-5">

            {modalFeedback && (() => {
              if (typeof modalFeedback === "object") {
                return (
                  <div className="p-4 rounded-xl bg-surface border border-positive/20 flex items-start gap-3 text-positive">
                    <div className="shrink-0 mt-0.5">
                      <Loader2 size={16} className="animate-spin text-positive" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-ink leading-tight">
                        {modalFeedback.title}
                      </h4>
                      <p className="text-xs text-positive/85 leading-relaxed font-sans">
                        {modalFeedback.description}
                      </p>
                    </div>
                  </div>
                );
              }
              return (
                <div className={`p-3 text-xs rounded-lg text-center ${
                  modalFeedback.startsWith("Error") 
                    ? "bg-negative/10 border-negative/30 text-negative" 
                    : "bg-positive/10 border-positive/30 text-positive font-semibold"
                }`}>
                  {modalFeedback}
                </div>
              );
            })()}

            <form onSubmit={handleQuickWithdraw} className="space-y-5">
              {/* Step 1: Coin Selection */}
              <div className="space-y-1.5">
                <label className="text-2xs text-muted font-sans uppercase font-bold tracking-wider block">Coin</label>
                <div className="grid grid-cols-3 gap-2 text-xs font-bold font-sans">
                  {["USDT", "BTC", "ETH"].map(coin => (
                    <button
                      key={coin}
                      type="button"
                      onClick={() => setWdrCoin(coin)}
                      className={`py-2 rounded-xl border text-center cursor-pointer transition-all ${
                        wdrCoin === coin 
                          ? "border-accent bg-accent/10 text-accent" 
                          : "border-line/50 bg-surface text-muted"
                      }`}
                    >
                      {coin}
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 2: Blockchain Network Selection */}
              <div className="space-y-1.5">
                <label className="text-2xs text-muted font-sans uppercase font-bold tracking-wider block">Blockchain Network</label>
                <div className="flex flex-wrap gap-2 text-2xs font-bold font-sans">
                  {getNetworksForWdrCoin(wdrCoin).map((net) => (
                    <button
                      key={net.id}
                      type="button"
                      onClick={() => setWdrNetwork(net.id)}
                      className={`px-3 py-1.5 rounded-xl border text-center transition-all cursor-pointer ${
                        wdrNetwork === net.id 
                          ? "border-accent bg-accent/10 text-accent font-extrabold" 
                          : "border-line/50 bg-surface text-muted"
                      }`}
                    >
                      {net.id}
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 3: Wallet Address & Amount Inputs */}
              <div className="space-y-1.5">
                <label className="text-2xs text-muted font-sans uppercase font-bold tracking-wider block">Wallet Address</label>
                <input
                  type="text"
                  required
                  value={wdrAddr}
                  onChange={(e) => setWdrAddr(e.target.value)}
                  placeholder="Fill in the withdrawal address"
                  className="w-full bg-surface border border-line/80 focus:border-accent focus:ring-1 focus:ring-accent rounded-xl py-2.5 px-3 text-2xs text-ink font-mono font-semibold transition-all focus:outline-none placeholder:text-2xs placeholder-slate-500"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-2xs text-muted font-sans uppercase font-bold tracking-wider">Amount</label>
                  <span className="text-2xs text-muted font-sans font-semibold">
                    Available Balance: {user.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })} {wdrCoin}
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    required
                    min="0.01"
                    step="any"
                    value={wdrAmt}
                    onChange={(e) => setWdrAmt(e.target.value)}
                    placeholder="Fill in the withdrawal amount"
                    className="w-full bg-surface border border-line/80 focus:border-accent focus:ring-1 focus:ring-accent rounded-xl py-2.5 px-3 pr-20 text-2xs text-ink font-mono font-semibold transition-all focus:outline-none placeholder:text-2xs placeholder-slate-500"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setWdrAmt(user.balance.toString())}
                      className="text-2xs text-accent hover:opacity-80 font-sans font-extrabold cursor-pointer uppercase"
                    >
                      All
                    </button>
                    <span className="text-2xs text-muted font-mono font-bold border-l border-line pl-2">
                      {wdrCoin}
                    </span>
                  </div>
                </div>
              </div>

              {/* Step 4: Fee Breakdown & Button Update */}
              <div className="flex justify-between items-center text-2xs font-sans text-muted pt-1">
                <span>Gas fee:</span>
                <span className="text-ink font-mono font-bold">
                  {wdrCoin === "USDT" ? "1.00 USDT" : wdrCoin === "BTC" ? "0.0002 BTC" : "0.003 ETH"}
                </span>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-accent hover:opacity-95 text-ground font-extrabold font-heading text-xs uppercase rounded-xl transition-all shadow-md shadow-accent/10 cursor-pointer tracking-wider"
              >
                Withdraw
              </button>
            </form>
        </div>
      </Modal>

      {/* Insufficient Balance Modal Overlay */}
      <Modal
        open={insufficientBalanceOpen}
        onClose={() => setInsufficientBalanceOpen(false)}
        size="sm"
      >
        <div className="space-y-5">
            <div className="text-center space-y-3">
              <div className="mx-auto w-12 h-12 rounded-full bg-warning-soft border border-warning-line flex items-center justify-center text-accent">
                <AlertTriangle size={24} className="animate-bounce" />
              </div>
              <h3 className="text-base font-bold text-ink uppercase tracking-wider font-heading">
                Insufficient Balance
              </h3>
              <p className="text-xs text-muted leading-relaxed font-sans">
                Your wallet balance is insufficient to complete this action. Please fund your wallet to continue.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setInsufficientBalanceOpen(false)}
                className="py-2.5 rounded-xl border border-line/50 hover:border-ink bg-transparent text-ink font-bold font-subheading text-2xs uppercase transition-all cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setInsufficientBalanceOpen(false);
                  setDepositModalOpen(true);
                }}
                className="py-2.5 rounded-xl bg-accent hover:opacity-95 text-ground font-extrabold font-subheading text-2xs uppercase transition-all shadow-md shadow-accent/15 cursor-pointer leading-relaxed"
              >
                Fund Wallet
              </button>
            </div>
        </div>
      </Modal>
    </>
  );
}
