import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import sendEmailHandler from "./api/send-email";

dotenv.config();

// Server-side Supabase admin client (service_role — bypasses RLS). Used ONLY to
// write the trusted `market_prices` table from the /api/markets route (bug #22).
// The service_role key must NEVER be exposed to the client. If it's not
// configured, price-syncing is skipped (buy/sell then reject as "no price").
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
  : null;

async function syncMarketPrices(assets: Array<{ symbol: string; price: number }>) {
  if (!supabaseAdmin) return;
  const now = new Date().toISOString();
  const rows = assets
    .filter(a => a && typeof a.price === "number" && a.price > 0)
    .map(a => ({ symbol: a.symbol, price: a.price, updated_at: now }));
  if (!rows.length) return;
  const { error } = await supabaseAdmin.from("market_prices").upsert(rows, { onConflict: "symbol" });
  if (error) console.error("Failed to sync market_prices:", error.message);
}

const PORT = parseInt(process.env.PORT || "5173", 10);
const HMR_PORT = parseInt(process.env.VITE_HMR_PORT || process.env.HMR_PORT || "24680", 10);

// Lazy initialize Gemini client to prevent startup crash if key is missing
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not configured. Please add it via AI Studio Settings > Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

async function startServer() {
  // Loud config check: transactional email cannot deliver to real users
  // without a verified sender. Warn clearly at startup rather than silently
  // failing per-send (the handler also hard-fails the request, see api/send-email.ts).
  if (!process.env.RESEND_FROM_EMAIL) {
    console.warn("[config] RESEND_FROM_EMAIL is not set — transactional email will be rejected until a verified sender address is configured.");
  }

  const app = express();
  app.use(express.json());

  // API Route: Send Transactional Email using Resend
  app.post("/api/send-email", sendEmailHandler as any);

  // API Route: Live Market Data Feed
  app.get("/api/markets", async (req, res) => {
    try {
      // Mock data fallback and stocks
      const fallbackData = {
        crypto: [
          { symbol: "BTC/USD", name: "Bitcoin", price: 98400.00, change: 2.45, high: 99200.00, low: 97100.00, volume: "24.1B" },
          { symbol: "ETH/USD", name: "Ethereum", price: 3412.80, change: -1.22, high: 3520.00, low: 3380.00, volume: "12.8B" },
          { symbol: "SOL/USD", name: "Solana", price: 187.65, change: 5.82, high: 191.00, low: 175.20, volume: "4.5B" },
          { symbol: "XRP/USD", name: "Ripple", price: 1.14, change: 10.15, high: 1.22, low: 1.02, volume: "3.2B" },
          { symbol: "ADA/USD", name: "Cardano", price: 0.62, change: -0.45, high: 0.65, low: 0.61, volume: "850M" },
          { symbol: "BNB/USD", name: "Binance Coin", price: 580.40, change: 1.15, high: 590.00, low: 572.00, volume: "1.2B" },
          { symbol: "DOT/USD", name: "Polkadot", price: 6.35, change: -2.31, high: 6.60, low: 6.25, volume: "180M" },
          { symbol: "DOGE/USD", name: "Dogecoin", price: 0.154, change: 4.82, high: 0.162, low: 0.145, volume: "950M" },
          { symbol: "SHIB/USD", name: "Shiba Inu", price: 0.000018, change: 3.12, high: 0.000019, low: 0.000017, volume: "420M" },
          { symbol: "LTC/USD", name: "Litecoin", price: 82.40, change: -0.85, high: 84.10, low: 81.50, volume: "350M" },
        ],
        stocks: [
          { symbol: "AAPL", name: "Apple Inc.", price: 182.30, change: 0.85, high: 183.50, low: 180.80, volume: "52.4M" },
          { symbol: "TSLA", name: "Tesla Inc.", price: 214.50, change: -3.42, high: 221.00, low: 212.30, volume: "83.1M" },
          { symbol: "NVDA", name: "NVIDIA Corp.", price: 924.80, change: 4.12, high: 935.00, low: 885.00, volume: "41.6M" },
          { symbol: "MSFT", name: "Microsoft Corp.", price: 415.60, change: 0.42, high: 418.00, low: 412.50, volume: "22.8M" },
          { symbol: "AMZN", name: "Amazon.com Inc.", price: 178.90, change: -1.15, high: 181.20, low: 177.50, volume: "32.1M" },
          { symbol: "GOOGL", name: "Alphabet Inc.", price: 172.50, change: 1.22, high: 174.10, low: 170.80, volume: "25.4M" },
          { symbol: "META", name: "Meta Platforms Inc.", price: 475.20, change: 2.15, high: 480.50, low: 468.20, volume: "18.2M" },
        ]
      };

      let liveCrypto = fallbackData.crypto;
      try {
        // Fetch accurate live pricing from Binance free API
        const symbolsMap: Record<string, any> = {
          "BTCUSDT": { symbol: "BTC/USD", name: "Bitcoin", cgId: "bitcoin" },
          "ETHUSDT": { symbol: "ETH/USD", name: "Ethereum", cgId: "ethereum" },
          "SOLUSDT": { symbol: "SOL/USD", name: "Solana", cgId: "solana" },
          "XRPUSDT": { symbol: "XRP/USD", name: "Ripple", cgId: "ripple" },
          "ADAUSDT": { symbol: "ADA/USD", name: "Cardano", cgId: "cardano" },
          "BNBUSDT": { symbol: "BNB/USD", name: "Binance Coin", cgId: "binancecoin" },
          "DOTUSDT": { symbol: "DOT/USD", name: "Polkadot", cgId: "polkadot" },
          "DOGEUSDT": { symbol: "DOGE/USD", name: "Dogecoin", cgId: "dogecoin" },
          "SHIBUSDT": { symbol: "SHIB/USD", name: "Shiba Inu", cgId: "shiba-inu" },
          "LTCUSDT": { symbol: "LTC/USD", name: "Litecoin", cgId: "litecoin" },
        };
        const symbolsArray = Object.keys(symbolsMap);
        const binanceUrl = `https://api.binance.com/api/v3/ticker/24hr?symbols=${encodeURIComponent(JSON.stringify(symbolsArray))}`;
        
        const binanceRes = await fetch(binanceUrl);
        if (binanceRes.ok) {
          const binanceData = await binanceRes.json();
          liveCrypto = binanceData.map((item: any) => ({
            symbol: symbolsMap[item.symbol].symbol,
            name: symbolsMap[item.symbol].name,
            price: parseFloat(item.lastPrice),
            change: parseFloat(item.priceChangePercent),
            high: parseFloat(item.highPrice),
            low: parseFloat(item.lowPrice),
            volume: (parseFloat(item.quoteVolume) / 1000000).toFixed(1) + "M",
          }));
          
          // Sort to keep BTC first, ETH second, etc based on our map order
          liveCrypto.sort((a, b) => {
             const keys = Object.values(symbolsMap).map(s => s.symbol);
             return keys.indexOf(a.symbol) - keys.indexOf(b.symbol);
          });
        } else {
          throw new Error(`Binance status ${binanceRes.status}`);
        }
      } catch (err) {
        console.error("Failed to fetch live crypto from Binance, trying CoinGecko fallback...", err);
        try {
          const cgIds = ["bitcoin", "ethereum", "solana", "ripple", "cardano", "binancecoin", "polkadot", "dogecoin", "shiba-inu", "litecoin"].join(",");
          const cgRes = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${cgIds}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true`);
          if (cgRes.ok) {
            const cgData = await cgRes.json();
            liveCrypto = liveCrypto.map(asset => {
              const cgId = asset.name.toLowerCase().replace(" ", "-");
              const idMap: Record<string, string> = { "bitcoin": "bitcoin", "ethereum": "ethereum", "solana": "solana", "ripple": "ripple", "cardano": "cardano", "binance-coin": "binancecoin", "polkadot": "polkadot", "dogecoin": "dogecoin", "shiba-inu": "shiba-inu", "litecoin": "litecoin" };
              const mappedId = idMap[cgId];
              if (mappedId && cgData[mappedId]) {
                return {
                  ...asset,
                  price: cgData[mappedId].usd,
                  change: cgData[mappedId].usd_24h_change,
                  volume: (cgData[mappedId].usd_24h_vol / 1000000).toFixed(1) + "M"
                };
              }
              return asset;
            });
          }
        } catch (cgErr) {
          console.error("CoinGecko fallback failed, using default mock values.", cgErr);
        }
      }

      // Persist the trusted prices for the buy/sell RPCs (bug #22). Fire-and-
      // forget — never block or fail the markets response on a price-sync error.
      void syncMarketPrices([...liveCrypto, ...fallbackData.stocks]);

      return res.json({
        crypto: liveCrypto,
        stocks: fallbackData.stocks
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // Dev server using Vite middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: {
          port: HMR_PORT
        }
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    if (process.env.NODE_ENV !== "production") {
      // Print localhost, not 0.0.0.0 (not a browsable address) and not
      // 127.0.0.1. Clerk development instances and their Cloudflare Turnstile
      // bot-protection widget key off the origin: on 127.0.0.1 the Turnstile
      // iframe fails to post its token back ("target origin ... does not match
      // the recipient window's origin"), which can leave a sign-up stuck.
      console.info(`Moneta Prime institutional platform listening at http://localhost:${PORT}`);
    }
  });
}

startServer().catch((err) => {
  console.error("Critical server bootstrap error:", err);
});




