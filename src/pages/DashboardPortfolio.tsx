import React, { useMemo, useState } from "react";
import { useApp } from "../context/AppContext";
import { Briefcase, Layers, PieChart, Target, TrendingUp, Users, Wallet } from "lucide-react";
import {
  AnimatedNumber,
  Badge,
  Button,
  EmptyState,
  Progress,
  SectionCard,
  SectionCardAction,
  StatCard,
} from "../components/ui";
import { formatDateTime, formatMoney } from "../lib/format";

interface DashboardPortfolioProps {
  onNavigate: (view: string) => void;
}

export const DashboardPortfolio: React.FC<DashboardPortfolioProps> = ({ onNavigate }) => {
  const { user, claimCopyTradePayout } = useApp();
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const handleClaimCopyPayout = async (copyTradeId: string) => {
    setClaimingId(copyTradeId);
    try {
      await claimCopyTradePayout(copyTradeId);
    } finally {
      setClaimingId(null);
    }
  };

  const stats = useMemo(() => {
    const totalHoldingValue = user.portfolioValue;
    // Running OR matured-but-unclaimed both stay in the "active" list so the
    // Claim Payout action is visible on the position card. Only trades whose
    // payout has actually been claimed (payoutCompleted) move to history.
    const activeCopyTrades = user.copyTrades.filter(
      (trade) => trade.status === "Running" || (trade.status === "Completed" && !trade.payoutCompleted)
    );
    const completedCopyTrades = user.copyTrades.filter(
      (trade) => trade.status === "Completed" && trade.payoutCompleted
    );

    const preProcessedPortfolio = user.portfolio.map((asset) => {
      const totalAssetMarketVal = asset.amount * asset.currentPrice;
      const totalCostValue = asset.amount * asset.avgBuyPrice;
      const profitLossVal = +(totalAssetMarketVal - totalCostValue).toFixed(2);
      const profitLossPercent =
        totalCostValue > 0 ? +((profitLossVal / totalCostValue) * 100).toFixed(2) : 0;
      const weightPercent =
        totalHoldingValue > 0 ? +((totalAssetMarketVal / totalHoldingValue) * 100).toFixed(1) : 0;

      return {
        ...asset,
        marketValue: totalAssetMarketVal,
        costBasis: totalCostValue,
        profitLoss: profitLossVal,
        profitLossPct: profitLossPercent,
        weight: weightPercent,
      };
    });

    const aggregateCost = preProcessedPortfolio.reduce((acc, cur) => acc + cur.costBasis, 0);
    const aggregatePnL = +(totalHoldingValue - aggregateCost).toFixed(2);
    const aggregatePnLPct = aggregateCost > 0 ? +((aggregatePnL / aggregateCost) * 100).toFixed(2) : 0;

    const runningInvestments = user.activeInvestments.filter(
      (item) => item.status === "Running" || item.status === "active"
    );
    const activePlanCapital = runningInvestments.reduce((acc, current) => acc + current.amount, 0);
    const activePlanProfits = runningInvestments.reduce(
      (acc, current) => acc + current.accumulatedProfit,
      0
    );
    const activeCopyCapital = activeCopyTrades.reduce((acc, current) => acc + current.amountInvested, 0);
    const activeCopyExpectedProfit = activeCopyTrades.reduce(
      (acc, current) => acc + current.expectedProfit,
      0
    );
    const totalEquity = +(
      user.balance +
      totalHoldingValue +
      activePlanCapital +
      activePlanProfits +
      activeCopyCapital +
      activeCopyExpectedProfit
    ).toFixed(2);

    return {
      totalHoldingValue,
      activeCopyTrades,
      completedCopyTrades,
      // Sorted heaviest first: an allocation list is read to answer "what am I
      // most exposed to", and that answer should be the top row.
      preProcessedPortfolio: [...preProcessedPortfolio].sort((a, b) => b.weight - a.weight),
      aggregatePnL,
      aggregatePnLPct,
      totalEquity,
    };
  }, [user]);

  const {
    totalHoldingValue,
    activeCopyTrades,
    completedCopyTrades,
    preProcessedPortfolio,
    aggregatePnL,
    aggregatePnLPct,
    totalEquity,
  } = stats;

  return (
    <div className="space-y-4 pb-4 sm:pb-6">
      <header className="border-b border-line pb-5">
        <div className="flex items-center gap-2.5">
          <Briefcase size={20} className="shrink-0 text-faint" aria-hidden="true" />
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Portfolio</h1>
        </div>
        <p className="mt-1 text-xs text-muted">
          Balances, open positions and copy-trading performance, updated in real time.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard
          emphasis
          label="Total equity"
          icon={Wallet}
          value={<AnimatedNumber value={totalEquity} prefix="$" />}
          hint="Cash, positions, plans and copy trades"
        />
        <StatCard
          label="Asset value"
          icon={Layers}
          value={<AnimatedNumber value={totalHoldingValue} prefix="$" />}
          hint="Open positions at mark price"
        />
        <StatCard
          label="Unrealised P/L"
          icon={TrendingUp}
          value={<AnimatedNumber value={aggregatePnL} prefix="$" />}
          delta={{ value: aggregatePnL, percent: aggregatePnLPct, label: "on cost basis" }}
        />
      </div>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-12">
        {/*
          Allocation.

          This panel used to show a "radial stack gauge": two dashed rings
          spinning on 15s and 35s CSS animations. They encoded nothing — no
          ring length, angle or colour was derived from the data — while
          reading as a chart. The real weights were only in the text legend
          beside it.

          Weight is a single measure compared across categories, so the form
          is bars, sorted descending. One measure also means one colour, which
          removes the need for a categorical palette entirely — the previous
          legend used five hardcoded hex swatches off the token system.
        */}
        <SectionCard className="lg:col-span-5" title="Allocation" icon={PieChart}>
          {preProcessedPortfolio.length === 0 ? (
            <EmptyState
              icon={PieChart}
              size="sm"
              title="No allocation yet"
              description="Open a position to see how your capital is distributed."
            />
          ) : (
            <ul className="space-y-3.5">
              {preProcessedPortfolio.map((item) => (
                <li key={item.symbol}>
                  <div className="mb-1.5 flex items-baseline justify-between gap-3">
                    <span className="min-w-0 truncate">
                      <span className="font-data text-xs font-semibold text-ink">{item.symbol}</span>
                      <span className="ml-2 text-2xs text-muted">{item.name}</span>
                    </span>
                    <span className="shrink-0 font-data text-xs font-semibold tabular-nums text-ink">
                      {item.weight}%
                    </span>
                  </div>
                  <Progress value={item.weight} label={`${item.symbol} allocation`} />
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard
          className="lg:col-span-7"
          title="Open positions"
          icon={Target}
          action={
            <SectionCardAction onClick={() => onNavigate("dashboard-trading")}>
              Trade
            </SectionCardAction>
          }
        >
          {preProcessedPortfolio.length === 0 ? (
            <EmptyState
              icon={Target}
              size="sm"
              title="No open positions"
              description="Positions you open will track here in real time."
              action={
                <Button size="sm" onClick={() => onNavigate("dashboard-trading")}>
                  Start trading
                </Button>
              }
            />
          ) : (
            <ul className="space-y-2">
              {preProcessedPortfolio.map((holding) => (
                <li
                  key={holding.symbol}
                  className="flex items-center justify-between gap-3 rounded-lg border border-line bg-panel p-3.5"
                >
                  <div className="min-w-0">
                    <strong className="block font-data text-sm text-ink">{holding.symbol}</strong>
                    <span className="text-2xs text-muted">
                      <span className="font-data tabular-nums">{holding.amount}</span> units ·{" "}
                      <span className="font-data tabular-nums">{holding.weight}%</span> of book
                    </span>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="block font-data text-sm font-semibold tabular-nums text-ink">
                      {formatMoney(holding.marketValue)}
                    </span>
                    <span
                      className={`font-data text-2xs font-semibold tabular-nums ${
                        holding.profitLoss >= 0 ? "text-positive" : "text-negative"
                      }`}
                    >
                      {formatMoney(holding.profitLoss, { sign: true })} ({holding.profitLossPct}%)
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>

      <SectionCard
        title="Copy trades"
        icon={Users}
        action={
          <SectionCardAction onClick={() => onNavigate("copy-trading")}>
            Browse traders
          </SectionCardAction>
        }
      >
        {activeCopyTrades.length === 0 ? (
          <EmptyState
            icon={Users}
            size="sm"
            title="No active copy trades"
            description="Follow a trader to mirror their positions automatically."
            action={
              <Button size="sm" onClick={() => onNavigate("copy-trading")}>
                Browse traders
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {activeCopyTrades.map((trade) => {
              const isClaimable = trade.status === "Completed" && !trade.payoutCompleted;
              const isClaiming = claimingId === trade.id;
              return (
                <article key={trade.id} className="rounded-lg border border-line bg-panel p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold text-ink">{trade.traderName}</h3>
                      <p className="mt-0.5 text-2xs text-muted">
                        {isClaimable ? "Matured" : `${trade.remainingDays}d remaining`}
                      </p>
                    </div>
                    <Badge tone={isClaimable ? "positive" : "accent"}>
                      {isClaimable ? "Matured" : trade.status}
                    </Badge>
                  </div>

                  <dl className="mt-3 grid grid-cols-2 gap-2">
                    {[
                      { label: "Invested", value: formatMoney(trade.amountInvested), tone: "text-ink" },
                      { label: "ROI", value: `${trade.roiPercent}%`, tone: "text-positive" },
                      { label: "Profit", value: formatMoney(trade.expectedProfit), tone: "text-positive" },
                      { label: "Total", value: formatMoney(trade.totalReturn), tone: "text-ink" },
                    ].map((cell) => (
                      <div key={cell.label}>
                        <dt className="text-2xs font-semibold uppercase tracking-[0.09em] text-faint">
                          {cell.label}
                        </dt>
                        <dd className={`font-data text-xs font-semibold tabular-nums ${cell.tone}`}>
                          {cell.value}
                        </dd>
                      </div>
                    ))}
                  </dl>

                  <Progress
                    className="mt-3"
                    value={trade.progress}
                    label={`${trade.traderName} copy trade progress`}
                  />
                  <p className="mt-2 text-2xs text-muted">Ends {formatDateTime(trade.endTimestamp)}</p>

                  {isClaimable && (
                    <Button
                      block
                      variant="positive"
                      size="sm"
                      className="mt-3"
                      loading={isClaiming}
                      onClick={() => handleClaimCopyPayout(trade.id)}
                    >
                      Claim {formatMoney(trade.totalReturn)}
                    </Button>
                  )}
                </article>
              );
            })}
          </div>
        )}

        {completedCopyTrades.length > 0 && (
          <div className="mt-5 border-t border-line pt-4">
            <h3 className="mb-2.5 text-2xs font-semibold uppercase tracking-[0.09em] text-faint">
              History
            </h3>
            <ul className="space-y-2">
              {completedCopyTrades.map((trade) => (
                <li
                  key={trade.id}
                  className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-lg border border-line bg-panel px-3 py-2.5 text-2xs"
                >
                  <span className="font-semibold text-ink">{trade.traderName}</span>
                  <span className="font-data tabular-nums text-muted">
                    Invested {formatMoney(trade.amountInvested)}
                  </span>
                  <span className="font-data tabular-nums text-positive">
                    Profit {formatMoney(trade.expectedProfit)}
                  </span>
                  <span className="font-data tabular-nums text-ink">
                    Returned {formatMoney(trade.totalReturn)}
                  </span>
                  <Badge tone="positive">{trade.payoutCompleted ? "Paid" : trade.status}</Badge>
                </li>
              ))}
            </ul>
          </div>
        )}
      </SectionCard>
    </div>
  );
};
