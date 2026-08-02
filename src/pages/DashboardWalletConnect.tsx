import React, { useState } from "react";
import { useWallet } from "../context/domains/WalletContext";
import { useNotifications } from "../context/domains/NotificationsContext";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";
import { Wallet, Info } from "lucide-react";
import { X } from "lucide-react";
import { Button } from "../components/ui";

const TrustWalletLogo = () => (
  <svg className="w-9 h-9 shrink-0" viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M128 0C77.4 20.3 36.2 32.5 13.7 34.8C10.7 35.1 8.5 37.6 8.5 40.6V126.9C8.5 197.8 77.2 247.9 123.4 255.4C126.4 255.9 129.6 255.9 132.6 255.4C178.8 247.9 247.5 197.8 247.5 126.9V40.6C247.5 37.6 245.3 35.1 242.3 34.8C219.8 32.5 178.6 20.3 128 0Z" fill="#3375BB"/>
    <path d="M128 43.1C141.4 69.4 163.6 89.2 192.1 100.1V126.9C192.1 170.8 156.4 202.9 128 211.5V43.1Z" fill="white" opacity="0.3"/>
    <path d="M128 43.1V211.5C99.6 202.9 63.9 170.8 63.9 126.9V100.1C92.4 89.2 114.6 69.4 128 43.1Z" fill="white"/>
  </svg>
);

const BinanceWalletLogo = () => (
  <svg className="w-9 h-9 shrink-0" viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="256" height="256" rx="64" fill="#F0B90B"/>
    <path d="M128 48L158 78L128 108L98 78L128 48Z" fill="black"/>
    <path d="M68 108L98 138L68 168L38 138L68 108Z" fill="black"/>
    <path d="M188 108L218 138L188 168L158 138L188 108Z" fill="black"/>
    <path d="M128 168L158 198L128 228L98 198L128 168Z" fill="black"/>
    <path d="M128 118L148 138L128 158L108 138L128 118Z" fill="black"/>
  </svg>
);

const BitcoinWalletLogo = () => (
  <svg className="w-9 h-9 shrink-0" viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="128" cy="128" r="128" fill="#F7931A"/>
    <path d="M101.3 138.8v30.9c2 .4 4 .7 5.9.8 14.1.8 23.6-5 23.6-18.7 0-11.8-8.1-13-29.5-13zm0-35.3v24.6h25.4c11.6 0 17.7-2.6 17.7-12 0-9.8-6.1-12.6-17.7-12.6H101.3z" fill="white"/>
    <path d="M192.2 121.3c-2.3-15.5-12.2-22.3-29.4-25.2 6.1-5.1 9.4-11.9 6.8-23.7-4.1-18.8-19.4-23.4-44.8-24.8V29.3H111v18.4c-4.1-.2-8.3-.3-12.4-.4V29h-13.8v18.2c-23.3 0-38.3 1.3-38.3 1.3l2.6 14.7s11-.5 20.8-.2c5.4.1 8.1 2.3 9 6.6l15.5 70c.8 3.6-1.1 6.1-4.7 5.9-6.4-.3-15.4-1.2-15.4-1.2l-2.8 15.8s15.9.9 29.5.9c3.9 0 7.8-.1 11.6-.2V195h13.8v-17.2c4.3.1 8.5.1 12.6.1v17.1h13.8v-17.5c28.2-1.3 45.4-7.9 49.3-28.7 3.1-16.1-2.9-25.2-14.7-29.3 10.3-4.5 15.6-12.7 13.9-24.2zm-65.5-32.9H111V63.9h15.7c11.5 0 17.6 2.3 17.6 11.8s-6.1 12.7-17.6 12.7zm19.8 61.2c0 11.2-7.8 13.2-22.1 12.4h-13.4v-25.5h13.4c14.3.1 22.1 1.9 22.1 13.1z" fill="white"/>
  </svg>
);

const BitPayWalletLogo = () => (
  <svg className="w-9 h-9 shrink-0" viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="128" cy="128" r="128" fill="#1A3B8B"/>
    <path d="M70 70H140C165 70 185 85 185 110C185 125 175 138 160 145C178 152 190 168 190 190C190 215 170 230 145 230H70V70ZM110 102V132H135C145 132 150 125 150 117C150 109 145 102 135 102H110ZM110 162V198H140C150 198 155 191 155 180C155 169 150 162 140 162H110Z" fill="white"/>
    <path d="M150 150L180 180L210 150H150Z" fill="#22D3EE"/>
  </svg>
);

const CoinbaseWalletLogo = () => (
  <svg className="w-9 h-9 shrink-0" viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="128" cy="128" r="128" fill="#0052FF"/>
    <rect x="72" y="72" width="112" height="112" rx="24" fill="white"/>
  </svg>
);

const BlockchainWalletLogo = () => (
  <svg className="w-9 h-9 shrink-0" viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="128" cy="128" r="128" fill="#121D33"/>
    <path d="M128 50L178 100L128 150L78 100L128 50Z" fill="#1067F0" opacity="0.8"/>
    <path d="M128 106L178 156L128 206L78 156L128 106Z" fill="#3B82F6" />
    <path d="M128 78L156 106L128 134L100 106L128 78Z" fill="#93C5FD" />
  </svg>
);

const CryptoComWalletLogo = () => (
  <svg className="w-9 h-9 shrink-0" viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="128" cy="128" r="128" fill="#0A1E3F"/>
    <path d="M128 50L200 90V166L128 206L56 166V90L128 50Z" stroke="#1199FA" strokeWidth="12" fill="none"/>
    <path d="M128 80L170 104V152L128 176L86 152V104L128 80Z" fill="#1199FA"/>
  </svg>
);

const MetaMaskWalletLogo = () => (
  <svg className="w-9 h-9 shrink-0" viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="256" height="256" rx="64" fill="#F6851B"/>
    <path d="M128 195L80 150H176L128 195Z" fill="#E2761B"/>
    <path d="M128 195L105 160H151L128 195Z" fill="#D7C1B1"/>
    <path d="M128 195L120 220H136L128 195Z" fill="#231F20"/>
    <path d="M50 80L75 140L100 110L50 80Z" fill="#E4761B"/>
    <path d="M206 80L181 140L156 110L206 80Z" fill="#E4761B"/>
    <path d="M75 140L128 160L181 140L128 175L75 140Z" fill="#D7C1B1"/>
    <path d="M75 140L105 160L128 150L75 140Z" fill="#231F20"/>
    <path d="M181 140L151 160L128 150L181 140Z" fill="#231F20"/>
  </svg>
);

const WalletIoWalletLogo = () => (
  <svg className="w-9 h-9 shrink-0" viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="128" cy="128" r="128" fill="#7C3AED"/>
    <rect x="70" y="80" width="116" height="96" rx="16" fill="white" />
    <circle cx="100" cy="110" r="12" fill="#7C3AED" />
    <circle cx="156" cy="110" r="12" fill="#7C3AED" />
    <path d="M90 145Q128 165 166 145" stroke="#7C3AED" strokeWidth="8" strokeLinecap="round" fill="none" />
  </svg>
);

const OwnbitWalletLogo = () => (
  <svg className="w-9 h-9 shrink-0" viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="128" cy="128" r="128" fill="#059669"/>
    <path d="M128 60C90 60 60 90 60 128s30 68 68 68 68-30 68-68S166 60 128 60ZM128 166C107 166 90 149 90 128s17-38 38-38 38 17 38 38-17 38-38 38Z" fill="white"/>
    <circle cx="128" cy="128" r="20" fill="white"/>
  </svg>
);

const walletLogos: Record<string, React.ReactNode> = {
  "Trust Wallet": <TrustWalletLogo />,
  "Binance Wallet": <BinanceWalletLogo />,
  "Bitcoin Wallet": <BitcoinWalletLogo />,
  "Bitpay Wallet": <BitPayWalletLogo />,
  "Coinbase Wallet": <CoinbaseWalletLogo />,
  "Blockchain Wallet": <BlockchainWalletLogo />,
  "Crypto.com Wallet": <CryptoComWalletLogo />,
  "Metamask Wallet": <MetaMaskWalletLogo />,
  "Wallet.io Wallet": <WalletIoWalletLogo />,
  "Ownbit Wallet": <OwnbitWalletLogo />
};

export const DashboardWalletConnect: React.FC = () => {
  const { saveWalletConnection } = useWallet();
  const { addNotification } = useNotifications();
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  useBodyScrollLock(showModal);
  const [isLoading, setIsLoading] = useState(false);

  const wallets = [
    "Trust Wallet", 
    "Binance Wallet", 
    "Bitcoin Wallet", 
    "Bitpay Wallet", 
    "Coinbase Wallet", 
    "Blockchain Wallet", 
    "Crypto.com Wallet", 
    "Metamask Wallet", 
    "Wallet.io Wallet", 
    "Ownbit Wallet"
  ];

  const handleConnect = () => {
    if (!selectedWallet) {
      addNotification("Please select a wallet first.");
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      saveWalletConnection(selectedWallet);
      addNotification(`Wallet preference saved for ${selectedWallet}.`);
      setIsLoading(false);
      setShowModal(false);
    }, 800);
  };

  return (
    <div className="space-y-5 pb-4 sm:pb-6 p-6 max-w-4xl mx-auto">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold font-heading text-ink flex items-center gap-2">
          <Wallet className="text-accent" />
          Personal Wallet Connect
        </h1>
        <p className="text-sm text-muted">
          Link your preferred external multi-sig custody or hot wallet. Secure end-to-end integration with Moneta Prime.
        </p>
      </div>

      <div className="bg-warning-soft border border-warning-line p-4 rounded-xl flex items-start gap-3">
        <Info className="text-warning shrink-0 mt-0.5" size={18} />
        <div className="text-xs text-warning leading-relaxed font-sans">
          <strong>Security Note:</strong> Always confirm you are on the official <strong>Moneta Prime</strong> domain before connecting. Connection utilizes encrypted handshakes to register node balances.
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Raw button: each wallet is a card-shaped choice — brand logo, name
            and a "Connect" pill in a justify-between row — not a control.
            Button forces inline-flex with centred content and a fixed height,
            which collapses the card. (The wallet brand logos inside are the
            documented palette exception, same as before.) */}
        {wallets.map(wallet => (
          <button 
            key={wallet} 
            onClick={() => { setSelectedWallet(wallet); setShowModal(true); }} 
            className="bg-surface border border-line/50 hover:border-accent p-4 rounded-xl flex items-center justify-between transition-all duration-300 group cursor-pointer text-ink hover:shadow-lg hover:shadow-accent/5"
          >
            <div className="flex items-center gap-3">
              <div className="transition-transform duration-300 group-hover:scale-110">
                {walletLogos[wallet] || <Wallet className="text-accent" />}
              </div>
              <span className="font-bold tracking-tight text-sm text-left">{wallet}</span>
            </div>
            <div className="bg-ground group-hover:bg-accent/15 border border-line/80 group-hover:border-accent/30 rounded-lg py-1 px-2 text-2xs uppercase font-bold tracking-wider text-muted group-hover:text-accent transition-colors">
              Connect
            </div>
          </button>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-ground/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-surface border border-line p-6 rounded-2xl w-full max-w-md space-y-5 animate-fade-in shadow-2xl relative">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Close dialog"
              onClick={() => setShowModal(false)}
              className="absolute top-2 right-2"
            >
              <X size={16} />
            </Button>

            <div className="flex items-center gap-3">
              {selectedWallet && walletLogos[selectedWallet]}
              <div>
                <h2 className="text-base font-bold text-ink leading-tight">Connect to {selectedWallet}</h2>
                <p className="text-2xs text-muted mt-0.5">Confirm this wallet preference</p>
              </div>
            </div>

            <div className="text-xs text-muted flex items-start gap-2 bg-ground/50 p-3.5 rounded-lg border border-line/50 font-sans leading-relaxed">
              <Info size={14} className="text-accent shrink-0 mt-0.5" />
              <span>Moneta Prime will never ask for or store seed phrases, private keys, or recovery words. This action only records your selected wallet provider for support context.</span>
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" disabled={isLoading} onClick={() => setShowModal(false)}>Cancel</Button>
              <Button className="flex-1" loading={isLoading} onClick={handleConnect}>Confirm</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

