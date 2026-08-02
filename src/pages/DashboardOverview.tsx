import React, { useMemo, useState } from "react";
import { useUser as useClerkUser } from "@clerk/clerk-react";
import { useSession } from "../context/domains/SessionContext";
import { useInvestmentPlans } from "../context/domains/InvestmentPlansContext";
import { useTraders } from "../context/domains/TradersContext";
import { useNotifications } from "../context/domains/NotificationsContext";
import { useWallet } from "../context/domains/WalletContext";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Briefcase,
  Check,
  CheckCircle2,
  Copy,
  DollarSign,
  FileText,
  History,
  Layers,
  LineChart,
  MinusCircle,
  PlusCircle,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";
import { motion } from "motion/react";
import { DashboardEquityChart } from "../components/charts/DashboardEquityChart";
import { UserAnnouncements } from "../components/announcements/UserAnnouncements";
import {
  AnimatedNumber,
  Badge,
  Button,
  Column,
  DataTable,
  EmptyState,
  Input,
  Progress,
  SectionCard,
  SectionCardAction,
  Skeleton,
  StatCard,
} from "../components/ui";
import { formatDate, formatDateTime, formatMoney, getUID } from "../lib/format";

interface DashboardOverviewProps {
  onNavigate: (view: string) => void;
  onOpenDeposit: () => void;
  onOpenWithdraw: () => void;
}

/* Sections rise in sequence rather than all at once. The stagger is 60ms —
   long enough to read as an order, short enough that the last card is in
   place well before the eye reaches it. */
const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 320, damping: 30 },
  },
};

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  onNavigate,
  onOpenDeposit,
  onOpenWithdraw,
}) => {
  const { user, authReady } = useSession();
  const { user: clerkUser, isLoaded: clerkLoaded } = useClerkUser();

  /*
   * Account security posture — derived, never asserted.
   *
   * This replaces a hardcoded "Security: High" chip that read identically
   * for every account regardless of its actual state. Both inputs here are
   * real and independently verifiable:
   *
   *   2FA  — clerkUser.twoFactorEnabled (Clerk UserResource, @clerk/shared
   *          3.47.7; confirmed present and non-deprecated in the installed
   *          version rather than assumed).
   *   KYC  — user.kyc.status from the session profile loader.
   *
   * NOTE on the KYC source: this deliberately does NOT use useKyc().
   * That context exposes `allKycSubmissions`, which its data hook gates on
   * isAdmin — for any non-admin it is always {}, so reading the signed-in
   * user's own status from it would report "unverified" for every normal
   * user. `user.kyc` is the per-user record, and is what the identity badge
   * a few lines below already uses.
   *
   * Both signals must be LOADED before a tier is shown. Rendering a tier
   * from unloaded state would reintroduce the original bug with better
   * timing — an assurance displayed before it is known. Hence `securityKnown`
   * gating a skeleton, and no default tier anywhere in the derivation.
   */
  const securityKnown = clerkLoaded && authReady;
  const twoFactorEnabled = clerkUser?.twoFactorEnabled === true;
  const kycApproved = user.kyc?.status === "approved";
  const securedCount = (twoFactorEnabled ? 1 : 0) + (kycApproved ? 1 : 0);

  // Wording is deliberately about THIS account, not a platform rating, and
  // deliberately not the old "High/Medium/Low". Two checks passing is real
  // hardening; it is not a general claim that the account is "highly secure".
  const securityTier =
    securedCount === 2
      ? { label: "Account secured", tone: "positive" as const }
      : securedCount === 1
        ? { label: "Partly secured", tone: "warning" as const }
        : { label: "Security setup needed", tone: "negative" as const };

  // Sends the user at the thing that actually moves the tier. 2FA lives in
  // Clerk's own account UI, so an unverified/rejected KYC is the only step
  // this app can route to itself.
  const securityAction =
    !kycApproved && (user.kyc?.status === "unverified" || user.kyc?.status === "rejected" || !user.kyc)
      ? { view: "dashboard-kyc", hint: "Verify identity" }
      : null;
  const { topUpInvestment, claimPlanPayout } = useInvestmentPlans();
  const { claimCopyTradePayout } = useTraders();
  const { addNotification } = useNotifications();
  const { setInsufficientBalanceOpen } = useWallet();

  const [copiedUid, setCopiedUid] = useState(false);
  const [claimingCopyId, setClaimingCopyId] = useState<string | null>(null);
  const [claimingInvId, setClaimingInvId] = useState<string | null>(null);
  const [topUpTarget, setTopUpTarget] = useState<string | null>(null);
  const [topUpAmount, setTopUpAmount] = useState<string>("");

  const uid = getUID(user.email);

  const handleClaimCopyPayout = async (copyTradeId: string) => {
    setClaimingCopyId(copyTradeId);
    try {
      await claimCopyTradePayout(copyTradeId);
    } finally {
      setClaimingCopyId(null);
    }
  };

  const handleClaimInvPayout = async (investmentId: string) => {
    setClaimingInvId(investmentId);
    try {
      await claimPlanPayout(investmentId);
    } finally {
      setClaimingInvId(null);
    }
  };

  const handleTopUp = async (invId: string) => {
    const val = parseFloat(topUpAmount);
    if (isNaN(val) || val <= 0) {
      addNotification("Please enter a valid amount to top up.");
      return;
    }
    const res = await topUpInvestment(invId, val);
    if (res.success) {
      setTopUpTarget(null);
      setTopUpAmount("");
    } else if (res.message === "INSUFFICIENT_BALANCE") {
      setInsufficientBalanceOpen(true);
    } else {
      addNotification(res.message);
    }
  };

  const stats = useMemo(() => {
    const availableCash = user.balance;
    const portfolioAssetsValue = user.portfolioValue; // Auto-updates via context market loops
    const runningInvestments = user.activeInvestments.filter(
      (item) => item.status === "Running" || item.status === "active"
    );
    // Matured-but-unclaimed copy trades (live-derived status "Completed" but
    // payout not yet claimed) count as still-active for net-worth purposes —
    // their capital+profit hasn't hit the balance yet. Only actually-paid
    // trades (payoutCompleted) move to the completed/history bucket. Without
    // this, a matured trade's value would vanish from equity until claimed.
    const runningCopyTrades = user.copyTrades.filter(
      (item) => item.status === "Running" || (item.status === "Completed" && !item.payoutCompleted)
    );
    const completedCopyTrades = user.copyTrades.filter(
      (item) => item.status === "Completed" && item.payoutCompleted
    );
    const activePlanCapital = runningInvestments.reduce((acc, cur) => acc + cur.amount, 0);
    const activePlanProfits = runningInvestments.reduce(
      (acc, cur) => acc + cur.accumulatedProfit,
      0
    );
    const activeCopyCapital = runningCopyTrades.reduce((acc, cur) => acc + cur.amountInvested, 0);
    const activeCopyExpectedProfit = runningCopyTrades.reduce(
      (acc, cur) => acc + cur.expectedProfit,
      0
    );

    const aggregateNetWorth = +(
      availableCash +
      portfolioAssetsValue +
      activePlanCapital +
      activePlanProfits +
      activeCopyCapital +
      activeCopyExpectedProfit
    ).toFixed(2);

    // Calculate P/L matching average purchase prices
    const totalCostBasis = user.portfolio.reduce(
      (acc, cur) => acc + cur.amount * cur.avgBuyPrice,
      0
    );
    const netPnL = totalCostBasis > 0 ? +(portfolioAssetsValue - totalCostBasis).toFixed(2) : 0;
    const netPnLPercent =
      totalCostBasis > 0 ? +((netPnL / totalCostBasis) * 100).toFixed(2) : 0;

    return {
      availableCash,
      portfolioAssetsValue,
      runningCopyTrades,
      completedCopyTrades,
      activePlanCapital,
      activePlanProfits,
      activeCopyCapital,
      aggregateNetWorth,
      netPnL,
      netPnLPercent,
    };
  }, [user]);

  const {
    availableCash,
    portfolioAssetsValue,
    runningCopyTrades,
    completedCopyTrades,
    activePlanCapital,
    activePlanProfits,
    activeCopyCapital,
    aggregateNetWorth,
    netPnL,
    netPnLPercent,
  } = stats;

  const transactionColumns: Column<(typeof user.transactions)[number]>[] = [
    {
      key: "id",
      header: "Tx ID",
      primary: true,
      cell: (tx) => <span className="font-data text-ink">{tx.id}</span>,
    },
    {
      key: "date",
      header: "Date",
      cell: (tx) => <span className="text-muted">{formatDateTime(tx.date)}</span>,
    },
    {
      key: "type",
      header: "Type",
      cell: (tx) => (
        <Badge
          tone={
            tx.type === "deposit"
              ? "positive"
              : tx.type === "withdrawal"
                ? "negative"
                : tx.type === "investment"
                  ? "accent"
                  : "neutral"
          }
        >
          {tx.type}
        </Badge>
      ),
    },
    {
      key: "asset",
      header: "Asset",
      // Not every transaction has one (plan top-ups, payouts). An em dash
      // says "no value"; a blank cell reads as a rendering failure, and on
      // the mobile card it left a label with nothing beside it.
      cell: (tx) => tx.asset || <span className="text-faint">—</span>,
    },
    { key: "amount", header: "Amount", numeric: true, cell: (tx) => formatMoney(tx.amount) },
    {
      key: "status",
      header: "Status",
      align: "right",
      cell: (tx) => {
        const done = tx.status === "completed" || tx.status === "approved";
        const failed = tx.status === "rejected" || tx.status === "failed";
        return (
          <Badge tone={done ? "positive" : failed ? "negative" : tx.status === "pending" ? "warning" : "neutral"}>
            {done ? <CheckCircle2 size={11} /> : <AlertTriangle size={11} />}
            {tx.status}
          </Badge>
        );
      },
    },
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-4 pb-4 sm:pb-6">
      {/* ── Header ───────────────────────────────────────────────
          The header once carried a "Security: High" chip that was
          hardcoded and identical for every account. It is now derived from
          two real signals (Clerk 2FA + KYC status) and shows a skeleton
          until both are known — see the securityTier derivation above. */}
      <motion.header
        variants={item}
        className="flex flex-col gap-4 border-b border-line pb-4 md:flex-row md:items-start md:justify-between"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <Wallet size={20} className="shrink-0 text-faint" aria-hidden="true" />
            <h1 className="text-2xl font-semibold tracking-tight text-ink">Asset overview</h1>
          </div>

          <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs">
            {/* Guarded: the name can legitimately be absent (profile still
                loading, or an account created without one), and "Welcome
                back," trailing into nothing reads as a rendering fault. */}
            <span className="text-muted">
              {user.name || user.email ? (
                <>
                  Welcome back,{" "}
                  <span className="font-medium text-ink">{user.name || user.email}</span>
                </>
              ) : (
                "Welcome back"
              )}
            </span>

            <span className="inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-2 py-1">
              <span className="text-2xs font-semibold uppercase tracking-[0.09em] text-faint">UID</span>
              <span className="select-all font-data text-2xs text-muted">{uid}</span>
              {/* Raw button: a 0.5-unit icon affordance sitting inline inside a
                  text chip. Button's smallest size is h-8 with horizontal
                  padding, which would break the chip's line height. */}
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(uid);
                  setCopiedUid(true);
                  setTimeout(() => setCopiedUid(false), 2000);
                }}
                className="rounded-sm p-0.5 text-faint transition-colors duration-[--duration-fast] hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent cursor-pointer"
                aria-label={copiedUid ? "UID copied" : "Copy UID"}
              >
                {copiedUid ? <Check size={11} className="text-positive" /> : <Copy size={11} />}
              </button>
              {/* Announced, not just shown — the icon swap is invisible to a
                  screen reader on its own. */}
              <span aria-live="polite" className="sr-only">
                {copiedUid ? "UID copied to clipboard" : ""}
              </span>
            </span>

            {user.kyc?.status === "approved" ? (
              <Badge tone="positive">
                <CheckCircle2 size={11} /> Identity verified
              </Badge>
            ) : user.kyc?.status === "pending" ? (
              <Badge tone="warning">
                <AlertTriangle size={11} /> Verification pending
              </Badge>
            ) : (
              // Unverified is an action, not just a state — it links to the
              // thing that resolves it. Stays raw: it is a transparent wrapper
              // around a Badge, so Button's own background, height and padding
              // would double up on the badge's.
              <button
                type="button"
                onClick={() => onNavigate("dashboard-kyc")}
                className="rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent cursor-pointer"
              >
                <Badge tone="negative" className="hover:brightness-110">
                  <AlertTriangle size={11} /> Verify identity
                  <ArrowRight size={11} />
                </Badge>
              </button>
            )}

            {/* Account security posture. Skeleton until both inputs are
                loaded — never a tier by default. */}
            {!securityKnown ? (
              <Skeleton width="w-32" height="h-6" className="rounded-full" />
            ) : securityAction ? (
              // Same pattern as the identity badge above: a transparent
              // wrapper so the badge keeps its own box.
              <button
                type="button"
                onClick={() => onNavigate(securityAction.view)}
                aria-label={`${securityTier.label}. ${securityAction.hint}`}
                className="rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent cursor-pointer"
              >
                <Badge tone={securityTier.tone} className="hover:brightness-110">
                  <ShieldCheck size={11} /> {securityTier.label}
                  <ArrowRight size={11} />
                </Badge>
              </button>
            ) : (
              <Badge tone={securityTier.tone}>
                <ShieldCheck size={11} /> {securityTier.label}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button icon={PlusCircle} onClick={onOpenDeposit}>
            Deposit
          </Button>
          <Button variant="secondary" icon={MinusCircle} onClick={onOpenWithdraw}>
            Withdraw
          </Button>
        </div>
      </motion.header>

      <UserAnnouncements />

      {/* ── Balances ─────────────────────────────────────────────
          Figures count on mount and on material change only. A live
          balance that re-animates on every market tick is unreadable. */}
      <motion.div variants={item} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* No delta on total equity. The figure that used to sit here was
            `portfolioValue − costBasis` labelled "today" — but it is
            all-time unrealised P/L on open positions, and its percentage is
            of cost basis, not of equity. Shown against total equity it read
            as "+89% today", which is wrong twice over. It now lives on the
            card whose value it actually describes. */}
        <StatCard
          emphasis
          label="Total equity"
          icon={Briefcase}
          value={<AnimatedNumber value={aggregateNetWorth} prefix="$" />}
          hint="Cash, positions, plans and copy trades"
        />
        <StatCard
          label="Available balance"
          icon={DollarSign}
          value={<AnimatedNumber value={availableCash} prefix="$" />}
          hint={`${formatMoney(activePlanCapital + activeCopyCapital)} in orders`}
        />
        <StatCard
          label="Derivatives account"
          icon={Activity}
          value={<AnimatedNumber value={portfolioAssetsValue} prefix="$" />}
          delta={{ value: netPnL, percent: netPnLPercent, label: "unrealised" }}
        />
        <StatCard
          label="Plan yield capital"
          icon={Layers}
          value={<AnimatedNumber value={activePlanCapital + activePlanProfits} prefix="$" />}
          hint={
            activePlanProfits > 0 ? `${formatMoney(activePlanProfits)} accrued` : "No accruals yet"
          }
        />
      </motion.div>

      <motion.div variants={item}>
        <SectionCard
          title="Equity trend"
          icon={LineChart}
          action={<span className="text-2xs text-faint">Live</span>}
        >
          <DashboardEquityChart currentEquity={aggregateNetWorth} />
        </SectionCard>
      </motion.div>

      {/* ── Investments + positions ──────────────────────────── */}
      <motion.div variants={item} className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <SectionCard
          className="lg:col-span-7"
          title="Active investments"
          icon={Layers}
          action={
            <SectionCardAction onClick={() => onNavigate("dashboard-plans")}>
              View plans
            </SectionCardAction>
          }
        >
          {user.activeInvestments.length === 0 ? (
            <EmptyState
              icon={FileText}
              size="sm"
              title="No active investments"
              description="Investment plans accrue daily and pay out on maturity."
              action={
                <Button size="sm" onClick={() => onNavigate("dashboard-plans")} iconRight={ArrowRight}>
                  Explore plans
                </Button>
              }
            />
          ) : (
            <div className="space-y-3">
              {user.activeInvestments.map((inv) => {
                const isCompleted = inv.status === "Completed" || inv.status === "completed";
                const isPaid = isCompleted && Boolean(inv.payoutTransactionId);
                const isClaimable = isCompleted && !inv.payoutTransactionId;
                const isClaimingInv = claimingInvId === inv.id;
                const expectedProfit = inv.expectedProfit ?? inv.accumulatedProfit;
                const totalReturn = inv.totalReturn ?? inv.amount + expectedProfit;
                const remainingDays = inv.remainingDays ?? 0;

                return (
                  <article
                    key={inv.id}
                    className="rounded-lg border border-line bg-panel p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-semibold text-ink">{inv.name}</h3>
                        <p className="mt-0.5 text-2xs text-muted">
                          Matures {formatDate(inv.endDate)}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <span className="block text-2xs font-semibold uppercase tracking-[0.09em] text-faint">
                          Profit
                        </span>
                        <strong className="font-data text-sm font-semibold tabular-nums text-positive">
                          {formatMoney(isCompleted ? expectedProfit : inv.accumulatedProfit, {
                            sign: true,
                          })}
                        </strong>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-3 text-2xs">
                      <span className="text-muted">
                        Allocated{" "}
                        <span className="font-data tabular-nums text-ink">
                          {formatMoney(inv.amount)}
                        </span>
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-muted">
                          {isPaid ? "Completed" : isClaimable ? "Matured" : `${remainingDays}d left`}
                        </span>
                        {/* Secondary, not ghost: at this size a ghost button
                            beside plain text reads as a label rather than
                            something you can press. */}
                        {!isCompleted && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setTopUpTarget(topUpTarget === inv.id ? null : inv.id)}
                            aria-expanded={topUpTarget === inv.id}
                          >
                            Top up
                          </Button>
                        )}
                      </div>
                    </div>

                    <Progress
                      className="mt-2.5"
                      value={inv.progress}
                      label={`${inv.name} progress`}
                    />

                    {!isCompleted && topUpTarget === inv.id && (
                      <div className="mt-3 flex items-end gap-2 border-t border-line pt-3">
                        <Input
                          className="flex-1"
                          type="number"
                          numeric
                          prefix="$"
                          label="Amount to add"
                          placeholder="0.00"
                          value={topUpAmount}
                          onChange={(e) => setTopUpAmount(e.target.value)}
                        />
                        <Button onClick={() => handleTopUp(inv.id)}>Confirm</Button>
                      </div>
                    )}

                    {isClaimable && (
                      <Button
                        block
                        variant="positive"
                        size="sm"
                        className="mt-3"
                        loading={isClaimingInv}
                        onClick={() => handleClaimInvPayout(inv.id)}
                      >
                        Claim {formatMoney(totalReturn)}
                      </Button>
                    )}

                    {isPaid && (
                      <div className="mt-3 rounded-md border border-positive-line bg-positive-soft py-2 text-center text-2xs font-semibold text-positive">
                        Paid {formatMoney(totalReturn)}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </SectionCard>

        <SectionCard
          className="lg:col-span-5"
          title="Open positions"
          icon={Activity}
          action={
            <SectionCardAction onClick={() => onNavigate("dashboard-portfolio")}>
              View details
            </SectionCardAction>
          }
        >
          {user.portfolio.length === 0 ? (
            <EmptyState
              icon={Activity}
              size="sm"
              title="No open positions"
              description="Positions you open will track here in real time."
              action={
                <Button size="sm" onClick={() => onNavigate("dashboard-trading")} iconRight={ArrowRight}>
                  Start trading
                </Button>
              }
            />
          ) : (
            <ul className="space-y-2">
              {user.portfolio.map((asset) => {
                const totalCost = asset.amount * asset.avgBuyPrice;
                const totalMarket = asset.amount * asset.currentPrice;
                const profitLoss = +(totalMarket - totalCost).toFixed(2);

                return (
                  <li
                    key={asset.symbol}
                    className="flex items-center justify-between gap-3 rounded-lg border border-line bg-panel p-3"
                  >
                    <div className="min-w-0">
                      <strong className="block font-data text-sm text-ink">{asset.symbol}</strong>
                      <span className="text-2xs text-muted">{asset.amount} holdings</span>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="block font-data text-sm font-semibold tabular-nums text-ink">
                        {formatMoney(totalMarket)}
                      </span>
                      <span
                        className={`font-data text-2xs font-semibold tabular-nums ${
                          profitLoss >= 0 ? "text-positive" : "text-negative"
                        }`}
                      >
                        {formatMoney(profitLoss, { sign: true })}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </SectionCard>
      </motion.div>

      {/* ── Copy trading ─────────────────────────────────────── */}
      <motion.div variants={item}>
        <SectionCard
          title="Copy trades"
          icon={Users}
          action={
            <SectionCardAction onClick={() => onNavigate("copy-trading")}>
              View traders
            </SectionCardAction>
          }
        >
          {runningCopyTrades.length === 0 ? (
            <EmptyState
              icon={Users}
              size="sm"
              title="No running copy trades"
              description="Follow a trader to mirror their positions automatically."
              action={
                <Button size="sm" onClick={() => onNavigate("copy-trading")} iconRight={ArrowRight}>
                  Browse traders
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {runningCopyTrades.map((trade) => {
                const isClaimable = trade.status === "Completed" && !trade.payoutCompleted;
                const isClaiming = claimingCopyId === trade.id;

                return (
                  <article
                    key={trade.id}
                    className="rounded-lg border border-line bg-panel p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-semibold text-ink">
                          {trade.traderName}
                        </h3>
                        <p className="mt-0.5 text-2xs text-muted">
                          Ends {formatDateTime(trade.endTimestamp)}
                        </p>
                      </div>
                      <Badge tone={isClaimable ? "positive" : "accent"}>
                        {isClaimable ? "Matured" : trade.status}
                      </Badge>
                    </div>

                    <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
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

                    <div className="mt-3 flex items-center justify-between text-2xs text-muted">
                      <span>{isClaimable ? "Matured" : `${trade.remainingDays}d remaining`}</span>
                      <span className="font-data tabular-nums">{trade.progress}%</span>
                    </div>
                    <Progress
                      className="mt-1.5"
                      value={trade.progress}
                      label={`${trade.traderName} copy trade progress`}
                    />

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
                {completedCopyTrades.slice(0, 4).map((trade) => (
                  <li
                    key={trade.id}
                    className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-lg border border-line bg-panel px-3 py-2.5 text-2xs"
                  >
                    <span className="font-semibold text-ink">{trade.traderName}</span>
                    <span className="font-data tabular-nums text-muted">
                      ROI {trade.roiPercent}%
                    </span>
                    <span className="font-data tabular-nums text-muted">
                      Invested {formatMoney(trade.amountInvested)}
                    </span>
                    <span className="font-data tabular-nums text-positive">
                      Returned {formatMoney(trade.totalReturn)}
                    </span>
                    <Badge tone="positive">{trade.payoutCompleted ? "Paid" : trade.status}</Badge>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </SectionCard>
      </motion.div>

      {/* ── Transactions ─────────────────────────────────────── */}
      <motion.div variants={item}>
        <SectionCard
          flush
          title="Recent transactions"
          icon={History}
          action={
            <SectionCardAction onClick={() => onNavigate("dashboard-transactions")}>
              View all
            </SectionCardAction>
          }
        >
          <div className="p-3 sm:p-0">
            <DataTable
              caption="Your four most recent transactions"
              columns={transactionColumns}
              rows={user.transactions.slice(0, 4)}
              rowKey={(tx) => tx.id}
              className="sm:[&>div]:rounded-none sm:[&>div]:border-0"
              empty={{
                icon: History,
                title: "No transactions yet",
                description: "Deposits, withdrawals and trades appear here.",
                action: <Button size="sm" icon={PlusCircle} onClick={onOpenDeposit}>Make a deposit</Button>,
              }}
            />
          </div>
        </SectionCard>
      </motion.div>
    </motion.div>
  );
};
