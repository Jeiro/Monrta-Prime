import React, { createContext, useContext, useEffect, useState } from "react";
import type { MarketAsset } from "../../types";

interface MarketsContextType {
  marketCrypto: MarketAsset[];
  marketStocks: MarketAsset[];
  isLoadingMarkets: boolean;
}

const MarketsContext = createContext<MarketsContextType | undefined>(undefined);

/**
 * Live crypto + stock prices, polled from /api/markets with a large inline
 * fallback set for when that endpoint is unavailable.
 *
 * This provider reads nothing else — no session, no Supabase — which is what
 * makes it worth isolating: it re-renders itself every 4.5s (the simulated
 * fluctuation tick) and every 25s (the refetch), and with the tree split it
 * takes only its own consumers with it instead of the entire app.
 */
export const MarketsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [marketCrypto, setMarketCrypto] = useState<MarketAsset[]>([]);
  const [marketStocks, setMarketStocks] = useState<MarketAsset[]>([]);
  const [isLoadingMarkets, setIsLoadingMarkets] = useState<boolean>(true);

  // Load Markets Data
  const loadMarketsData = async () => {
    try {
      const res = await fetch("/api/markets");
      if (res.ok) {
        const data = await res.json();
        const processedCrypto = data.crypto.map((c: any) => ({
          ...c,
          sparkline: Array.from({ length: 12 }, () => c.price * (1 + (Math.random() * 0.04 - 0.02)))
        }));
        const processedStocks = data.stocks.map((s: any) => ({
          ...s,
          sparkline: Array.from({ length: 12 }, () => s.price * (1 + (Math.random() * 0.02 - 0.01)))
        }));
        setMarketCrypto(processedCrypto);
        setMarketStocks(processedStocks);
      } else {
        throw new Error("API failed");
      }
    } catch (e) {
      const mockC: MarketAsset[] = [
        { symbol: "BTC/USD", name: "Bitcoin", price: 98400.00, change: 2.45, high: 99200.00, low: 97100.00, volume: "24.1B", sparkline: [98100, 98300, 97900, 98200, 98900, 98600, 99100, 98900, 99200, 98400.00] },
        { symbol: "ETH/USD", name: "Ethereum", price: 3412.80, change: -1.22, high: 3520.00, low: 3380.00, volume: "12.8B", sparkline: [3480, 3460, 3490, 3450, 3420, 3440, 3410, 3430, 3405, 3412.8] },
        { symbol: "SOL/USD", name: "Solana", price: 187.65, change: 5.82, high: 191.00, low: 175.20, volume: "4.5B", sparkline: [176, 178, 175, 180, 182, 185, 183, 188, 186, 187.65] },
        { symbol: "XRP/USD", name: "Ripple", price: 1.14, change: 10.15, high: 1.22, low: 1.02, volume: "3.2B", sparkline: [1.01, 1.03, 1.05, 1.02, 1.08, 1.12, 1.10, 1.15, 1.13, 1.14] },
        { symbol: "ADA/USD", name: "Cardano", price: 0.62, change: -0.45, high: 0.65, low: 0.61, volume: "850M", sparkline: [0.63, 0.64, 0.62, 0.63, 0.61, 0.62, 0.62, 0.63, 0.61, 0.62] },
        { symbol: "BNB/USD", name: "Binance Coin", price: 580.40, change: 1.15, high: 590.00, low: 572.00, volume: "1.2B", sparkline: [570, 574, 572, 576, 578, 582, 580, 584, 582, 580.4] },
        { symbol: "DOT/USD", name: "Polkadot", price: 6.35, change: -2.31, high: 6.60, low: 6.25, volume: "180M", sparkline: [6.5, 6.4, 6.45, 6.35, 6.3, 6.38, 6.32, 6.35] },
        { symbol: "DOGE/USD", name: "Dogecoin", price: 0.154, change: 4.82, high: 0.162, low: 0.145, volume: "950M", sparkline: [0.142, 0.145, 0.148, 0.146, 0.151, 0.153, 0.154] },
        { symbol: "SHIB/USD", name: "Shiba Inu", price: 0.000018, change: 3.12, high: 0.000019, low: 0.000017, volume: "420M", sparkline: [0.000017, 0.0000175, 0.000018] },
        { symbol: "LTC/USD", name: "Litecoin", price: 82.40, change: -0.85, high: 84.10, low: 81.50, volume: "350M", sparkline: [83.1, 82.8, 83.2, 82.5, 82.9, 82.4] },
        { symbol: "LINK/USD", name: "Chainlink", price: 15.20, change: 1.74, high: 15.60, low: 14.80, volume: "210M", sparkline: [14.9, 15.0, 14.85, 15.1, 15.2] },
        { symbol: "UNI/USD", name: "Uniswap", price: 7.85, change: -1.45, high: 8.10, low: 7.70, volume: "160M", sparkline: [7.95, 7.9, 7.82, 7.88, 7.85] },
        { symbol: "AVAX/USD", name: "Avalanche", price: 34.60, change: 2.11, high: 35.80, low: 33.20, volume: "280M", sparkline: [33.8, 34.1, 33.9, 34.4, 34.6] },
        { symbol: "MATIC/USD", name: "Polygon", price: 0.58, change: -0.92, high: 0.61, low: 0.56, volume: "110M", sparkline: [0.59, 0.585, 0.58] },
        { symbol: "TON/USD", name: "Toncoin", price: 7.15, change: 6.25, high: 7.35, low: 6.65, volume: "340M", sparkline: [6.7, 6.9, 7.0, 7.12, 7.15] },
        { symbol: "TRX/USD", name: "TRON", price: 0.118, change: 0.45, high: 0.122, low: 0.115, volume: "250M", sparkline: [0.116, 0.117, 0.118] },
        { symbol: "XLM/USD", name: "Stellar", price: 0.124, change: 1.25, high: 0.128, low: 0.121, volume: "90M", sparkline: [0.122, 0.123, 0.124] },
        { symbol: "ATOM/USD", name: "Cosmos", price: 8.45, change: -2.15, high: 8.80, low: 8.35, volume: "130M", sparkline: [8.65, 8.52, 8.45] },
        { symbol: "NEAR/USD", name: "NEAR Protocol", price: 5.65, change: 3.42, high: 5.85, low: 5.40, volume: "220M", sparkline: [5.42, 5.55, 5.65] },
        { symbol: "ALGO/USD", name: "Algorand", price: 0.185, change: -1.12, high: 0.192, low: 0.181, volume: "65M", sparkline: [0.187, 0.184, 0.185] },
        { symbol: "FTM/USD", name: "Fantom", price: 0.82, change: 5.14, high: 0.85, low: 0.77, volume: "105M", sparkline: [0.78, 0.80, 0.82] },
        { symbol: "ICP/USD", name: "Internet Computer", price: 11.40, change: -1.82, high: 11.90, low: 11.20, volume: "95M", sparkline: [11.6, 11.5, 11.4] },
        { symbol: "HBAR/USD", name: "Hedera", price: 0.082, change: -0.42, high: 0.086, low: 0.080, volume: "75M", sparkline: [0.083, 0.082] },
        { symbol: "APT/USD", name: "Aptos", price: 9.15, change: 2.85, high: 9.45, low: 8.80, volume: "155M", sparkline: [8.85, 9.02, 9.15] },
        { symbol: "SUI/USD", name: "Sui", price: 1.25, change: 4.15, high: 1.32, low: 1.18, volume: "185M", sparkline: [1.19, 1.22, 1.25] },
        { symbol: "OP/USD", name: "Optimism", price: 2.15, change: -2.44, high: 2.25, low: 2.10, volume: "140M", sparkline: [2.21, 2.18, 2.15] },
        { symbol: "ARB/USD", name: "Arbitrum", price: 0.95, change: -1.85, high: 0.99, low: 0.92, volume: "125M", sparkline: [0.97, 0.96, 0.95] },
        { symbol: "FIL/USD", name: "Filecoin", price: 5.40, change: 1.12, high: 5.60, low: 5.25, volume: "80M", sparkline: [5.32, 5.38, 5.40] },
        { symbol: "VET/USD", name: "VeChain", price: 0.034, change: -0.58, high: 0.036, low: 0.033, volume: "55M", sparkline: [0.0345, 0.034] },
        { symbol: "LDO/USD", name: "Lido DAO", price: 1.85, change: 2.20, high: 1.92, low: 1.78, volume: "115M", sparkline: [1.81, 1.83, 1.85] },
        { symbol: "GRT/USD", name: "The Graph", price: 0.28, change: 3.14, high: 0.30, low: 0.27, volume: "90M", sparkline: [0.27, 0.275, 0.28] },
        { symbol: "RNDR/USD", name: "Render Token", price: 8.85, change: 7.42, high: 9.15, low: 8.10, volume: "260M", sparkline: [8.2, 8.5, 8.85] },
        { symbol: "AAVE/USD", name: "Aave", price: 110.15, change: 1.25, high: 115.00, low: 108.30, volume: "145M", sparkline: [108.9, 109.5, 110.15] },
        { symbol: "MKR/USD", name: "Maker", price: 2320.00, change: -1.18, high: 2390.00, low: 2280.00, volume: "85M", sparkline: [2350, 2330, 2320] },
        { symbol: "INJ/USD", name: "Injective", price: 22.40, change: 4.85, high: 23.50, low: 21.05, volume: "120M", sparkline: [21.2, 21.8, 22.4] },
        { symbol: "RUNE/USD", name: "THORChain", price: 5.15, change: -3.12, high: 5.40, low: 5.02, volume: "95M", sparkline: [5.32, 5.21, 5.15] },
        { symbol: "IMX/USD", name: "Immutable", price: 1.45, change: 2.11, high: 1.52, low: 1.38, volume: "75M", sparkline: [1.39, 1.42, 1.45] },
        { symbol: "FET/USD", name: "Fetch.ai", price: 1.62, change: 8.42, high: 1.70, low: 1.48, volume: "190M", sparkline: [1.50, 1.55, 1.62] },
        { symbol: "FLOW/USD", name: "Flow", price: 0.65, change: -0.45, high: 0.68, low: 0.61, volume: "45M", sparkline: [0.66, 0.64, 0.65] },
        { symbol: "WIF/USD", name: "dogwifhat", price: 2.15, change: 12.14, high: 2.30, low: 1.85, volume: "210M", sparkline: [1.90, 2.05, 2.15] },
        { symbol: "PEPE/USD", name: "Pepe", price: 0.000012, change: 9.25, high: 0.000013, low: 0.000011, volume: "320M", sparkline: [0.000011, 0.0000115, 0.000012] },
        { symbol: "STX/USD", name: "Stacks", price: 1.82, change: -1.75, high: 1.90, low: 1.76, volume: "110M", sparkline: [1.88, 1.84, 1.82] },
        { symbol: "THETA/USD", name: "Theta Network", price: 2.35, change: 3.12, high: 2.45, low: 2.22, volume: "80M", sparkline: [2.25, 2.30, 2.35] },
        { symbol: "EGLD/USD", name: "MultiversX", price: 34.50, change: -1.82, high: 35.90, low: 33.80, volume: "50M", sparkline: [35.2, 34.8, 34.5] },
        { symbol: "SAND/USD", name: "The Sandbox", price: 0.38, change: -0.42, high: 0.40, low: 0.36, volume: "60M", sparkline: [0.39, 0.385, 0.38] },
        { symbol: "MANA/USD", name: "Decentraland", price: 0.42, change: 1.15, high: 0.44, low: 0.40, volume: "55M", sparkline: [0.41, 0.415, 0.42] },
        { symbol: "FIDA/USD", name: "Bonfida", price: 0.28, change: 0.95, high: 0.30, low: 0.26, volume: "15M", sparkline: [0.27, 0.275, 0.28] },
        { symbol: "CHZ/USD", name: "Chiliz", price: 0.095, change: 2.85, high: 0.098, low: 0.091, volume: "40M", sparkline: [0.091, 0.093, 0.095] },
        { symbol: "ENS/USD", name: "Ethereum Name Service", price: 16.40, change: 5.12, high: 17.20, low: 15.80, volume: "65M", sparkline: [15.5, 16.0, 16.4] },
        { symbol: "CRV/USD", name: "Curve DAO Token", price: 0.32, change: -1.45, high: 0.34, low: 0.31, volume: "35M", sparkline: [0.33, 0.325, 0.32] },
        { symbol: "GALA/USD", name: "Gala", price: 0.038, change: 4.25, high: 0.040, low: 0.036, volume: "75M", sparkline: [0.036, 0.037, 0.038] },
        { symbol: "JUP/USD", name: "Jupiter", price: 0.98, change: 6.82, high: 1.05, low: 0.92, volume: "125M", sparkline: [0.91, 0.95, 0.98] }
      ];
      const mockS: MarketAsset[] = [
        { symbol: "AAPL", name: "Apple Inc.", price: 182.30, change: 0.85, high: 183.50, low: 180.80, volume: "52.4M", sparkline: [181.2, 181.5, 180.8, 181.9, 182.1, 182.3] },
        { symbol: "TSLA", name: "Tesla Inc.", price: 214.50, change: -3.42, high: 221.00, low: 212.30, volume: "83.1M", sparkline: [219.5, 218.0, 216.5, 217.2, 215.1, 214.5] },
        { symbol: "NVDA", name: "NVIDIA Corp.", price: 924.80, change: 4.12, high: 935.00, low: 885.00, volume: "41.6M", sparkline: [889, 895, 902, 915, 910, 924.8] },
        { symbol: "MSFT", name: "Microsoft Corp.", price: 415.60, change: 0.42, high: 418.00, low: 412.50, volume: "22.8M", sparkline: [412, 414, 413, 416, 415.6] },
        { symbol: "AMZN", name: "Amazon.com Inc.", price: 178.90, change: -1.15, high: 181.20, low: 177.50, volume: "32.1M", sparkline: [180.5, 179.8, 178.9] },
        { symbol: "GOOGL", name: "Alphabet Inc.", price: 172.50, change: 1.22, high: 174.10, low: 170.80, volume: "25.4M", sparkline: [170.2, 171.4, 172.5] },
        { symbol: "META", name: "Meta Platforms Inc.", price: 475.20, change: 2.15, high: 480.50, low: 468.20, volume: "18.2M", sparkline: [468.5, 471.2, 475.2] },
        { symbol: "NFLX", name: "Netflix Inc.", price: 610.40, change: -1.82, high: 622.00, low: 605.50, volume: "8.5M", sparkline: [618, 615, 610.4] },
        { symbol: "AMD", name: "Advanced Micro Devices", price: 164.80, change: -2.45, high: 170.10, low: 162.30, volume: "42.1M", sparkline: [168.2, 166.5, 164.8] },
        { symbol: "INTC", name: "Intel Corp.", price: 30.15, change: -0.85, high: 30.90, low: 29.80, volume: "35.2M", sparkline: [30.4, 30.2, 30.15] },
        { symbol: "PYPL", name: "PayPal Holdings", price: 62.40, change: 0.45, high: 63.20, low: 61.80, volume: "12.4M", sparkline: [62.0, 62.2, 62.4] },
        { symbol: "ADBE", name: "Adobe Inc.", price: 482.60, change: 1.05, high: 488.50, low: 477.15, volume: "4.8M", sparkline: [478.5, 480.1, 482.6] },
        { symbol: "CRM", name: "Salesforce Inc.", price: 278.40, change: -1.15, high: 282.00, low: 275.50, volume: "7.2M", sparkline: [280, 279, 278.4] },
        { symbol: "COIN", name: "Coinbase Global", price: 232.10, change: 6.85, high: 240.50, low: 221.80, volume: "15.6M", sparkline: [220, 225, 232.1] },
        { symbol: "QCOM", name: "QUALCOMM Inc.", price: 173.20, change: 0.95, high: 175.50, low: 171.10, volume: "9.2M", sparkline: [171.5, 172.4, 173.2] },
        { symbol: "AVGO", name: "Broadcom Inc.", price: 1350.20, change: 1.82, high: 1370.00, low: 1335.50, volume: "3.1M", sparkline: [1330, 1342, 1350.2] },
        { symbol: "ASML", name: "ASML Holding", price: 915.40, change: -1.12, high: 928.00, low: 902.50, volume: "2.4M", sparkline: [922, 918, 915.4] },
        { symbol: "MU", name: "Micron Technology", price: 112.50, change: 3.42, high: 115.20, low: 108.40, volume: "21.5M", sparkline: [108.9, 110.5, 112.5] },
        { symbol: "AMAT", name: "Applied Materials", price: 205.80, change: 0.65, high: 208.90, low: 203.10, volume: "6.8M", sparkline: [204.2, 205.1, 205.8] },
        { symbol: "TXN", name: "Texas Instruments", price: 168.40, change: -0.35, high: 170.20, low: 166.80, volume: "5.1M", sparkline: [169.1, 168.7, 168.4] },
        { symbol: "COST", name: "Costco Wholesale", price: 725.60, change: 0.82, high: 730.50, low: 720.10, volume: "4.2M", sparkline: [721.2, 723.4, 725.6] },
        { symbol: "PEP", name: "PepsiCo Inc.", price: 171.20, change: -0.22, high: 173.00, low: 169.80, volume: "5.5M", sparkline: [171.5, 171.3, 171.2] },
        { symbol: "SBUX", name: "Starbucks Corp.", price: 82.40, change: -1.45, high: 84.00, low: 81.50, volume: "7.8M", sparkline: [83.5, 83.0, 82.4] },
        { symbol: "NKE", name: "Nike Inc.", price: 95.15, change: 0.15, high: 96.50, low: 94.20, volume: "8.1M", sparkline: [95.0, 95.15] },
        { symbol: "DIS", name: "Walt Disney Co.", price: 114.30, change: -0.85, high: 116.00, low: 113.10, volume: "9.6M", sparkline: [115.2, 114.3] },
        { symbol: "CMG", name: "Chipotle Mexican Grill", price: 298.50, change: 1.55, high: 301.00, low: 295.00, volume: "1.1M", sparkline: [293.0, 298.5] },
        { symbol: "LULU", name: "Lululemon Athletica", price: 345.20, change: -4.12, high: 362.00, low: 341.00, volume: "2.8M", sparkline: [358.0, 345.2] },
        { symbol: "MSTR", name: "MicroStrategy Inc.", price: 1420.50, change: 11.22, high: 1480.00, low: 1310.00, volume: "6.2M", sparkline: [1310, 1420.5] },
        { symbol: "PANW", name: "Palo Alto Networks", price: 292.80, change: -1.35, high: 298.00, low: 289.50, volume: "3.5M", sparkline: [295, 292.8] },
        { symbol: "FTNT", name: "Fortinet Inc.", price: 61.20, change: 0.75, high: 62.10, low: 60.50, volume: "4.4M", sparkline: [60.8, 61.2] },
        { symbol: "ZS", name: "Zscaler Inc.", price: 182.40, change: -2.15, high: 188.00, low: 179.50, volume: "2.9M", sparkline: [186, 182.4] },
        { symbol: "DDOG", name: "Datadog Inc.", price: 118.50, change: 1.15, high: 121.20, low: 116.40, volume: "3.8M", sparkline: [117, 118.5] },
        { symbol: "ORCL", name: "Oracle Corp.", price: 124.50, change: 1.15, high: 126.00, low: 123.20, volume: "10.4M", sparkline: [123.5, 124.5] },
        { symbol: "CSCO", name: "Cisco Systems Inc.", price: 47.80, change: -0.42, high: 48.30, low: 47.10, volume: "15.2M", sparkline: [48.1, 47.8] },
        { symbol: "ABNB", name: "Airbnb Inc.", price: 148.60, change: 2.15, high: 151.20, low: 145.80, volume: "4.8M", sparkline: [145.2, 148.6] },
        { symbol: "UBER", name: "Uber Technologies", price: 68.40, change: 3.22, high: 69.50, low: 66.85, volume: "18.5M", sparkline: [66.5, 68.4] },
        { symbol: "SNOW", name: "Snowflake Inc.", price: 152.30, change: -4.15, high: 158.40, low: 150.10, volume: "6.2M", sparkline: [156.4, 152.3] },
        { symbol: "PLTR", name: "Palantir Technologies", price: 24.50, change: 8.12, high: 25.40, low: 22.80, volume: "38.4M", sparkline: [22.4, 24.5] },
        { symbol: "NET", name: "Cloudflare Inc.", price: 92.15, change: -1.85, high: 95.00, low: 90.80, volume: "5.1M", sparkline: [93.5, 92.15] },
        { symbol: "SHOP", name: "Shopify Inc.", price: 74.80, change: 0.95, high: 76.20, low: 73.10, volume: "9.6M", sparkline: [73.5, 74.8] },
        { symbol: "MDB", name: "MongoDB Inc.", price: 365.40, change: -3.42, high: 375.00, low: 360.50, volume: "2.1M", sparkline: [372.0, 365.4] },
        { symbol: "NOW", name: "ServiceNow Inc.", price: 742.60, change: 1.12, high: 748.50, low: 735.00, volume: "1.8M", sparkline: [738.0, 742.6] },
        { symbol: "SQ", name: "Block Inc.", price: 65.15, change: 2.45, high: 66.80, low: 63.90, volume: "11.2M", sparkline: [63.5, 65.15] },
        { symbol: "TEAM", name: "Atlassian Corp.", price: 185.30, change: -1.75, high: 191.00, low: 183.20, volume: "3.2M", sparkline: [188.5, 185.3] },
        { symbol: "WDAY", name: "Workday Inc.", price: 262.40, change: 0.15, high: 265.80, low: 259.10, volume: "2.5M", sparkline: [261.9, 262.4] },
        { symbol: "OKTA", name: "Okta Inc.", price: 92.40, change: -1.18, high: 95.20, low: 91.00, volume: "3.4M", sparkline: [93.5, 92.4] },
        { symbol: "SPLK", name: "Splunk Inc.", price: 156.20, change: 0.05, high: 157.00, low: 155.80, volume: "1.5M", sparkline: [156.0, 156.2] },
        { symbol: "MRVL", name: "Marvell Technology", price: 68.15, change: 4.12, high: 69.80, low: 65.10, volume: "12.8M", sparkline: [65.4, 68.15] },
        { symbol: "CRWD", name: "CrowdStrike Holdings", price: 315.40, change: 5.82, high: 322.00, low: 308.50, volume: "6.5M", sparkline: [305.2, 315.4] },
        { symbol: "ALNY", name: "Alnylam Pharmaceuticals", price: 154.20, change: -0.45, high: 156.80, low: 152.10, volume: "1.2M", sparkline: [155.0, 154.2] },
        { symbol: "GILD", name: "Gilead Sciences Inc.", price: 66.80, change: 0.25, high: 67.50, low: 65.90, volume: "7.4M", sparkline: [66.5, 66.8] },
        { symbol: "SIRI", name: "Sirius XM Holdings", price: 3.85, change: -1.12, high: 3.98, low: 3.75, volume: "21.2M", sparkline: [3.92, 3.85] }
      ];
      setMarketCrypto(mockC);
      setMarketStocks(mockS);
    } finally {
      setIsLoadingMarkets(false);
    }
  };

  useEffect(() => {
    const isMobileViewport = window.matchMedia("(max-width: 767px)").matches;
    const refreshMs = isMobileViewport ? 60000 : 25000;
    loadMarketsData();
    const fetchInterval = setInterval(() => {
      if (!document.hidden) loadMarketsData();
    }, refreshMs);
    return () => clearInterval(fetchInterval);
  }, []);

  // Fluctuations
  useEffect(() => {
    const isMobileViewport = window.matchMedia("(max-width: 767px)").matches;
    const marketFlux = setInterval(() => {
      if (document.hidden) return;
      setMarketCrypto(prev =>
        prev.map(asset => {
          const delta = (Math.random() * 0.003 - 0.0015);
          const nextPrice = +(asset.price * (1 + delta)).toFixed(asset.price > 10 ? 2 : 4);
          const nextSpark = [...asset.sparkline.slice(1), nextPrice];
          return {
            ...asset,
            price: nextPrice,
            change: +(asset.change + delta * 100).toFixed(2),
            sparkline: nextSpark,
            high: nextPrice > asset.high ? nextPrice : asset.high,
            low: nextPrice < asset.low ? nextPrice : asset.low,
          };
        })
      );
    }, isMobileViewport ? 12000 : 4500);
    return () => clearInterval(marketFlux);
  }, []);

  return (
    <MarketsContext.Provider value={{ marketCrypto, marketStocks, isLoadingMarkets }}>
      {children}
    </MarketsContext.Provider>
  );
};

export const useMarkets = () => {
  const context = useContext(MarketsContext);
  if (context === undefined) {
    throw new Error("useMarkets must be used inside a MarketsProvider");
  }
  return context;
};
