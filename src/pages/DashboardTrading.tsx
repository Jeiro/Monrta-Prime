import React, { useEffect, useMemo, useRef, useState } from "react";
import { useApp } from "../context/AppContext";
import { TradingViewWidget } from "../components/TradingViewWidget";
import {
  Activity,
  BarChart2,
  Eye,
  EyeOff,
  Search,
  ShieldAlert,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import {
  Alert,
  Button,
  Column,
  DataTable,
  EmptyState,
  Input,
  SectionCard,
  Tabs,
} from "../components/ui";
import { formatMoney } from "../lib/format";

interface DashboardTradingProps {
  initialAsset?: string;
  onNavigate: (view: string) => void;
}

export const DashboardTrading: React.FC<DashboardTradingProps> = ({ initialAsset, onNavigate }) => {
  const { marketCrypto, marketStocks, user, executeTrade, setInsufficientBalanceOpen } = useApp();
  const [selectedAssetSymbol, setSelectedAssetSymbol] = useState(initialAsset || "BTC/USD");
  const [showBalance, setShowBalance] = useState(true);
  const [watchlistQuery, setWatchlistQuery] = useState("");
  const watchlistRef = useRef<HTMLDivElement>(null);

  const fullMarketList = [...marketCrypto, ...marketStocks];
  const activeAsset = fullMarketList.find((a) => a.symbol === selectedAssetSymbol) ||
    marketCrypto[0] || {
      symbol: "BTC/USD",
      name: "Bitcoin",
      price: 98400.0,
      change: 2.45,
      high: 99200,
      low: 97100,
      volume: "24.1B",
    };

  const filteredMarket = useMemo(() => {
    const q = watchlistQuery.trim().toLowerCase();
    if (!q) return fullMarketList;
    return fullMarketList.filter(
      (item) =>
        item.symbol.toLowerCase().includes(q) || item.name.toLowerCase().includes(q)
    );
  }, [fullMarketList, watchlistQuery]);

  // Buy/Sell form parameters
  const [tradeType, setTradeType] = useState<"buy" | "sell">("buy");
  const [orderType, setOrderType] = useState<"market" | "limit">("market");
  const [amountInputTxt, setAmountInputTxt] = useState("");
  const [priceInput, setPriceInput] = useState(activeAsset.price.toString());
  const [submitting, setSubmitting] = useState(false);

  // Execution notification logs
  const [log, setLog] = useState<string | null>(null);

  useEffect(() => {
    setPriceInput(activeAsset.price.toString());
  }, [selectedAssetSymbol]); // Intentional: Only reset price input when switching assets, not on every market tick

  const triggerLog = (msg: string) => {
    setLog(msg);
    setTimeout(() => setLog(null), 6000);
  };

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLog(null);

    if (!user.isLoggedIn) {
      onNavigate("auth");
      return;
    }

    const amountValue = parseFloat(amountInputTxt);
    if (!amountValue || amountValue <= 0) {
      triggerLog("Error: Invalid capital amount specified.");
      return;
    }

    const orderPrice = orderType === "market" ? activeAsset.price : parseFloat(priceInput);
    if (!orderPrice || orderPrice <= 0) {
      triggerLog("Error: Invalid execution trigger rate.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await executeTrade(
        selectedAssetSymbol,
        activeAsset.name,
        tradeType,
        amountValue,
        orderPrice,
        selectedAssetSymbol.includes("/")
      );

      if (result.success) {
        setAmountInputTxt("");
        triggerLog(result.message);
      } else if (result.message === "INSUFFICIENT_BALANCE") {
        setInsufficientBalanceOpen(true);
      } else {
        triggerLog(`Error: ${result.message}`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const baseSymbol = activeAsset.symbol.split("/")[0];
  const effectivePrice = orderType === "market" ? activeAsset.price : parseFloat(priceInput) || 0;
  const parsedAmount = parseFloat(amountInputTxt) || 0;
  const estimatedQty = effectivePrice > 0 ? +(parsedAmount / effectivePrice).toFixed(6) : 0;

  const positionColumns: Column<(typeof user.portfolio)[number]>[] = [
    {
      key: "symbol",
      header: "Asset",
      primary: true,
      cell: (a) => <span className="font-data font-semibold text-ink">{a.symbol}</span>,
    },
    { key: "amount", header: "Size", numeric: true, cell: (a) => a.amount },
    {
      key: "avg",
      header: "Avg cost",
      numeric: true,
      cell: (a) => <span className="text-muted">{formatMoney(a.avgBuyPrice)}</span>,
    },
    { key: "price", header: "Mark price", numeric: true, cell: (a) => formatMoney(a.currentPrice) },
    {
      key: "pl",
      header: "Unrealised P/L",
      numeric: true,
      cell: (a) => {
        const buyValue = a.amount * a.avgBuyPrice;
        const curValue = a.amount * a.currentPrice;
        const pl = +(curValue - buyValue).toFixed(2);
        const plpct = buyValue > 0 ? +((pl / buyValue) * 100).toFixed(2) : 0;
        return (
          <span className={pl >= 0 ? "text-positive" : "text-negative"}>
            {formatMoney(pl, { sign: true })} ({plpct}%)
          </span>
        );
      },
    },
    {
      key: "value",
      header: "Value",
      numeric: true,
      cell: (a) => formatMoney(a.amount * a.currentPrice),
    },
  ];

  return (
    <div className="space-y-4 pb-4 sm:pb-6">
      {/* ── Ticker bar ──────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4 rounded-xl border border-line bg-surface px-5 py-3.5">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <div>
            <span className="block text-2xs font-semibold uppercase tracking-[0.09em] text-faint">
              Pair
            </span>
            <button
              type="button"
              // Was a querySelector on the escaped Tailwind class
              // ".lg\\:col-span-3" — a DOM lookup keyed to a layout utility,
              // which silently breaks the moment the grid changes. A ref
              // points at the actual element.
              onClick={() => watchlistRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })}
              className="mt-1 flex items-center gap-1.5 rounded-md font-data text-sm font-semibold text-ink transition-colors duration-[--duration-fast] hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent cursor-pointer"
            >
              {activeAsset.symbol}
            </button>
          </div>

          <div className="hidden h-8 border-l border-line sm:block" />

          <div>
            <span className="flex items-center gap-1 text-2xs font-semibold uppercase tracking-[0.09em] text-faint">
              <Activity size={10} aria-hidden="true" /> Mark price
            </span>
            {/* Was animate-pulse. A permanently throbbing price is unreadable
                and implies a staleness state that isn't real. */}
            <strong className="mt-1 block font-data text-sm font-semibold tabular-nums text-ink">
              {formatMoney(activeAsset.price)}
            </strong>
          </div>

          <div className="hidden h-8 border-l border-line sm:block" />

          <div>
            <span className="block text-2xs font-semibold uppercase tracking-[0.09em] text-faint">
              24h change
            </span>
            <span
              className={`mt-1 flex items-center gap-1 font-data text-sm font-semibold tabular-nums ${
                activeAsset.change >= 0 ? "text-positive" : "text-negative"
              }`}
            >
              {activeAsset.change >= 0 ? (
                <TrendingUp size={13} aria-hidden="true" />
              ) : (
                <TrendingDown size={13} aria-hidden="true" />
              )}
              {activeAsset.change >= 0 ? "+" : ""}
              {activeAsset.change}%
            </span>
          </div>
        </div>

        <div className="text-right">
          <div className="flex items-center justify-end gap-2">
            <span className="text-2xs font-semibold uppercase tracking-[0.09em] text-faint">
              Available
            </span>
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
          <span className="mt-0.5 block font-data text-sm font-semibold tabular-nums text-ink">
            {showBalance ? formatMoney(user.balance) : "••••••"}
          </span>
        </div>
      </div>

      {/* ── Workspace ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-12">
        {/*
          Source order is the desktop reading order (watchlist → chart →
          ticket), but on a phone that buries the order ticket under a full
          watchlist and a 420px chart — on a trading screen, the one thing
          the user came to do. Below `lg` the order becomes
          chart → ticket → watchlist, so the ticket is one short scroll away.
        */}
        {/* Watchlist */}
        <div ref={watchlistRef} className="order-3 lg:order-1 lg:col-span-3">
          <SectionCard title="Watchlist" icon={BarChart2} className="h-full">
            <Input
              aria-label="Filter watchlist"
              placeholder="Filter assets"
              value={watchlistQuery}
              onChange={(e) => setWatchlistQuery(e.target.value)}
              prefix={<Search size={13} />}
            />

            <div
              role="listbox"
              aria-label="Trading pairs"
              className="mt-3 max-h-[340px] space-y-1 overflow-y-auto pr-1"
            >
              {filteredMarket.length === 0 ? (
                <p className="py-6 text-center text-xs text-muted">No assets match “{watchlistQuery}”.</p>
              ) : (
                filteredMarket.map((item) => {
                  const selected = selectedAssetSymbol === item.symbol;
                  return (
                    // Was a <div onClick> — the entire watchlist was
                    // unreachable by keyboard, so the pair could only be
                    // changed with a mouse.
                    <button
                      key={item.symbol}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onClick={() => setSelectedAssetSymbol(item.symbol)}
                      className={
                        "flex w-full items-center justify-between gap-2 rounded-lg border px-2.5 py-2 text-left " +
                        "transition-colors duration-[--duration-fast] cursor-pointer " +
                        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent " +
                        (selected
                          ? "border-accent-line bg-accent-soft"
                          : "border-transparent hover:bg-raised")
                      }
                    >
                      <span className="min-w-0">
                        <span className="block font-data text-xs font-semibold text-ink">
                          {item.symbol}
                        </span>
                        <span className="line-clamp-1 text-2xs text-muted">{item.name}</span>
                      </span>
                      <span className="shrink-0 text-right">
                        <span className="block font-data text-xs tabular-nums text-ink">
                          {formatMoney(item.price, { decimals: item.price > 10 ? 2 : 4 })}
                        </span>
                        <span
                          className={`font-data text-2xs font-semibold tabular-nums ${
                            item.change >= 0 ? "text-positive" : "text-negative"
                          }`}
                        >
                          {item.change >= 0 ? "+" : ""}
                          {item.change}%
                        </span>
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </SectionCard>
        </div>

        {/* Chart */}
        <div className="order-1 lg:order-2 lg:col-span-6 min-h-[420px]">
          <TradingViewWidget symbol={selectedAssetSymbol} />
        </div>

        {/* Order ticket */}
        <div className="order-2 lg:order-3 lg:col-span-3">
          <SectionCard title="Place order" className="h-full">
            <form onSubmit={handleOrderSubmit} className="space-y-4">
              {/* Buy/sell. Semantic colour: these ARE the outcome. */}
              <div
                role="radiogroup"
                aria-label="Order side"
                className="grid grid-cols-2 gap-1 rounded-lg border border-line bg-panel p-1"
              >
                {(["buy", "sell"] as const).map((side) => {
                  const active = tradeType === side;
                  return (
                    <button
                      key={side}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setTradeType(side)}
                      className={
                        "rounded-md py-2 text-xs font-semibold uppercase tracking-wide " +
                        "transition-colors duration-[--duration-fast] cursor-pointer " +
                        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent " +
                        (active
                          ? side === "buy"
                            ? "bg-positive text-ground"
                            : "bg-negative text-ground"
                          : "text-muted hover:text-ink")
                      }
                    >
                      {side === "buy" ? "Buy" : "Sell"}
                    </button>
                  );
                })}
              </div>

              <Tabs<"market" | "limit">
                variant="pill"
                layoutGroup="order-type"
                aria-label="Order type"
                value={orderType}
                onChange={setOrderType}
                className="w-full [&>button]:flex-1"
                items={[
                  { id: "market", label: "Market" },
                  { id: "limit", label: "Limit" },
                ]}
              />

              {log && (
                <Alert tone={log.startsWith("Error") ? "error" : "success"}>{log}</Alert>
              )}

              {orderType === "limit" && (
                <Input
                  label="Limit price"
                  type="number"
                  step="0.01"
                  numeric
                  prefix="$"
                  value={priceInput}
                  onChange={(e) => setPriceInput(e.target.value)}
                />
              )}

              <Input
                label="Order amount"
                type="number"
                min="10"
                required
                numeric
                prefix="$"
                value={amountInputTxt}
                onChange={(e) => setAmountInputTxt(e.target.value)}
                placeholder="0.00"
                hint="Minimum $10"
              />

              {/*
                The leverage slider (1x–50x) that used to sit here has been
                removed, not restyled.

                `executeTrade` takes no leverage argument, and its body checks
                `user.balance < amount` and deducts the full amount. So the
                control changed nothing about the order — but the summary
                below it displayed "Order Cost: amount / leverage", telling a
                user placing a $1,000 order at 50x that it would cost $20 when
                $1,000 was actually required and taken.

                A false cost figure on the confirm step of a financial
                transaction is not a styling issue, so the control is gone
                until margin is genuinely implemented end to end.
              */}

              <dl className="space-y-1.5 border-t border-line pt-3 text-2xs">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">Estimated quantity</dt>
                  <dd className="font-data tabular-nums text-ink">
                    {estimatedQty.toFixed(6)} {baseSymbol}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">Price</dt>
                  <dd className="font-data tabular-nums text-ink">{formatMoney(effectivePrice)}</dd>
                </div>
                <div className="flex justify-between gap-3 border-t border-line pt-1.5">
                  <dt className="font-semibold text-ink">Order cost</dt>
                  <dd className="font-data font-semibold tabular-nums text-ink">
                    {formatMoney(parsedAmount)}
                  </dd>
                </div>
              </dl>

              <Button
                type="submit"
                block
                size="lg"
                loading={submitting}
                variant={tradeType === "buy" ? "positive" : "danger"}
              >
                {tradeType === "buy" ? `Buy ${baseSymbol}` : `Sell ${baseSymbol}`}
              </Button>
            </form>

            <div className="mt-4 flex gap-2 border-t border-line pt-3 text-2xs leading-relaxed text-muted">
              <ShieldAlert size={16} className="mt-px shrink-0 text-warning" aria-hidden="true" />
              <span>
                Trading carries risk. Only commit capital you can afford to lose.
              </span>
            </div>
          </SectionCard>
        </div>
      </div>

      {/* ── Open positions ──────────────────────────────────────── */}
      <SectionCard flush title="Open positions" icon={Activity}>
        <div className="p-3 sm:p-0">
          {user.portfolio.length === 0 ? (
            <EmptyState
              icon={Activity}
              size="sm"
              title="No open positions"
              description="Place an order above and it will appear here."
            />
          ) : (
            <DataTable
              caption="Your open positions"
              columns={positionColumns}
              rows={user.portfolio}
              rowKey={(a) => a.symbol}
              className="sm:[&>div]:rounded-none sm:[&>div]:border-0"
            />
          )}
        </div>
      </SectionCard>
    </div>
  );
};
