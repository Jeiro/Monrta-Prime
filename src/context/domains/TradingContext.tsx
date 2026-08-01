import React, { createContext, useContext, useEffect } from "react";
import toast from "react-hot-toast";
import { usePortfolio } from "../../hooks/data/usePortfolio";
import { useSession } from "./SessionContext";
import { useAuditLogWriter } from "./AuditLogContext";
import { useNotifications } from "./NotificationsContext";
import { useMarkets } from "./MarketsContext";
import { useInvestmentPlans } from "./InvestmentPlansContext";

interface TradingContextType {
  executeTrade: (
    symbol: string,
    name: string,
    type: "buy" | "sell",
    amount: number,
    price: number,
    isCrypto: boolean
  ) => Promise<{ success: boolean; message: string }>;
}

const TradingContext = createContext<TradingContextType | undefined>(undefined);

/**
 * Spot buy/sell and the holdings they produce.
 *
 * Sits below Markets and InvestmentPlans because the live-mark effect below
 * re-derives `user.portfolioValue` from market prices (and carries `plans` in
 * its dependency list, as it always has).
 */
export const TradingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { supabase, user, setUser, authReady, currentSupabaseUserId, refetchCurrentUserProfile } = useSession();
  const { handleLog } = useAuditLogWriter();
  const { addNotification } = useNotifications();
  const { marketCrypto, marketStocks } = useMarkets();
  const { plans } = useInvestmentPlans();

  const { portfolio, buyAsset, sellAsset } = usePortfolio(supabase, authReady, currentSupabaseUserId);

  // Keep portfolio in sync with its Supabase source.
  //
  // NOTE: this overlay effect depends on `user.isLoggedIn` as well as its hook
  // data. The data hooks (gated on authReady + userId) can resolve and fire
  // this effect BEFORE the profile-loader sets isLoggedIn true — e.g. right
  // after a refresh, when Clerk briefly reports "loaded but signed out" and
  // authReady is flipped true early (see the signed-out branch of the profile
  // loader). Without isLoggedIn in the deps, that early fire hits the
  // `prev.isLoggedIn ? … : prev` guard as a no-op and never re-runs (the hook
  // data reference doesn't change again), stranding the fetched data and
  // leaving the whole dashboard empty. Re-running when isLoggedIn flips true
  // re-applies the already-fetched data.
  useEffect(() => {
    setUser(prev => prev.isLoggedIn ? { ...prev, portfolio } : prev);
  }, [portfolio, user.isLoggedIn]);

  // Sync live portfolio marks. Investment/copy-trade maturity payouts are
  // now claimed explicitly (via claimPlanPayout, using the atomic Supabase
  // RPC) rather than auto-credited here — auto-crediting on every price
  // tick would mean hitting the database every few seconds, and silently
  // paying out without user action isn't standard broker behavior anyway.
  useEffect(() => {
    setUser(prev => {
      if (!prev.isLoggedIn) return prev;

      let totalAssetVal = 0;
      let marksStale = false;
      const updatedPort = prev.portfolio.map(holding => {
        const matchingLive = [...marketCrypto, ...marketStocks].find(
          m => m.symbol.split("/")[0] === holding.symbol
        );
        if (matchingLive) {
          totalAssetVal += holding.amount * matchingLive.price;
          // A holding's stored mark counts as stale once it lags the live
          // price by ≥0.05% — bounded PER HOLDING, not on the total.
          // (A total-value threshold let individual marks drift visibly
          // out of sync with the live prices shown beside them whenever
          // gains and losses across holdings cancelled out.)
          if (
            !holding.currentPrice ||
            Math.abs(matchingLive.price - holding.currentPrice) >= holding.currentPrice * 0.0005
          ) {
            marksStale = true;
          }
          return { ...holding, currentPrice: matchingLive.price };
        }
        return holding;
      });

      // Skip rewriting `user` (which re-renders every consumer) only when
      // truly nothing meaningful moved: every mark within 0.05% of live
      // AND the total within a cent. Skipped drift accumulates against the
      // last-applied values, so staleness stays bounded at ~0.05%.
      if (!marksStale && Math.abs(totalAssetVal - prev.portfolioValue) < 0.01) {
        return prev;
      }

      return {
        ...prev,
        portfolio: updatedPort,
        portfolioValue: +totalAssetVal.toFixed(2)
      };
    });
    // user.portfolio.length matters: this effect derives portfolioValue from
    // prev.portfolio, but the holdings are seeded by a separate effect that
    // usually resolves AFTER the first market tick. Without this dependency
    // the value stayed at $0 — with the holdings visibly listed right beside
    // it — until the next tick happened to fire. Depending on the length (not
    // the array identity) means it re-derives when holdings arrive or change
    // count, while price movement stays covered by marketCrypto/marketStocks.
  }, [marketCrypto, marketStocks, plans, user.portfolio.length]);

  const executeTrade = async (
    symbol: string,
    name: string,
    type: "buy" | "sell",
    amount: number,
    price: number,
    isCrypto: boolean
  ): Promise<{ success: boolean; message: string }> => {
    if (!user.isLoggedIn || !user.email) {
      return { success: false, message: "AUTH_REQUIRED" };
    }
    if (amount <= 0 || isNaN(amount)) {
      return { success: false, message: "Please specify a valid trade amount." };
    }

    const quantity = +(amount / price).toFixed(6);

    if (type === "buy") {
      if (user.balance < amount) {
        return { success: false, message: "INSUFFICIENT_BALANCE" };
      }

      try {
        await buyAsset(symbol, name, amount, price, quantity, isCrypto ? "crypto" : "stock");
        await refetchCurrentUserProfile();
      } catch (error) {
        console.error("Failed to execute buy order:", error);
        return { success: false, message: "Failed to execute trade. Please try again." };
      }

      handleLog("Market Order Fulfilled", `Purchased $${amount} of ${symbol} at $${price}`, user.email, "success");
      addNotification(`Market Buy Executed: ${quantity} ${symbol.split("/")[0]} filled.`);
      toast.success("Trade executed successfully");

      return { success: true, message: `Market Buy Order completed successfully.` };

    } else {
      const holding = portfolio.find(p => p.symbol === symbol);
      if (!holding || holding.amount <= 0) {
        return { success: false, message: "You do not own any active holdings in this asset." };
      }
      if (holding.amount < quantity) {
        return { success: false, message: `Insufficient assets. You own ${holding.amount} units, but this sale requires ${quantity} units.` };
      }

      try {
        await sellAsset(symbol, amount, price, quantity);
        await refetchCurrentUserProfile();
      } catch (error) {
        console.error("Failed to execute sell order:", error);
        return { success: false, message: "Failed to execute trade. Please try again." };
      }

      handleLog("Market Sale Settled", `Liquidated ${quantity} ${symbol.split("/")[0]} for $${amount}`, user.email, "success");
      addNotification(`Market Sell Executed: ${quantity} ${symbol.split("/")[0]} discharged.`);
      toast.success("Trade executed successfully");
      return { success: true, message: `Market Sell Order completed successfully.` };
    }
  };

  return (
    <TradingContext.Provider value={{ executeTrade }}>
      {children}
    </TradingContext.Provider>
  );
};

export const useTrading = () => {
  const context = useContext(TradingContext);
  if (context === undefined) {
    throw new Error("useTrading must be used inside a TradingProvider");
  }
  return context;
};
