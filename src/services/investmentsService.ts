import { DEFAULT_CURRENCY, FALLBACK_GUEST_EMAIL } from "../constants";
import { INVESTMENT_STATUSES, TRANSACTION_STATUSES } from "../constants/statuses";
import type { ActiveInvestment, InvestmentPlan, Transaction } from "../types";
import { enrichTransaction } from "./transactionsService";
import { roundMoney, timestampId, todayIsoDate } from "./utils";

export const DEFAULT_INVESTMENT_PLANS: InvestmentPlan[] = [
  {
    id: "plan-bronze",
    name: "Bronze Tier",
    minDeposit: 100,
    maxDeposit: 999,
    durationDays: 7,
    roiPercent: 12,
    roiCapPercent: 12,
    description: "An entry-level plan with a short lockup period. Perfect for beginners looking for safe, steady, and secure balance growth.",
    status: "active",
    enabled: true,
    displayOrder: 10,
    accentColor: "#CD7F32"
  },
  {
    id: "plan-silver",
    name: "Silver Tier",
    minDeposit: 1000,
    maxDeposit: 4999,
    durationDays: 10,
    roiPercent: 18,
    roiCapPercent: 18,
    description: "An upgraded plan designed for growing portfolios. Earn higher daily rewards with a flexible, medium-term commitment.",
    status: "active",
    enabled: true,
    displayOrder: 20,
    accentColor: "#94a3b8"
  },
  {
    id: "plan-gold",
    name: "Gold Tier",
    minDeposit: 5000,
    maxDeposit: 9999,
    durationDays: 14,
    roiPercent: 24,
    roiCapPercent: 24,
    description: "A premium plan tailored for serious investors. Get maximized return rates with structured capital protection.",
    status: "active",
    enabled: true,
    displayOrder: 30,
    badge: "Popular",
    accentColor: "#6AA5FF"
  },
  {
    id: "plan-platinum",
    name: "Platinum Tier",
    minDeposit: 10000,
    maxDeposit: 49999,
    durationDays: 21,
    roiPercent: 36,
    roiCapPercent: 36,
    description: "An elite wealth plan featuring top-tier yield generation and priority balance scaling for large accounts.",
    status: "active",
    enabled: true,
    displayOrder: 40,
    accentColor: "#818cf8"
  },
  {
    id: "plan-diamond",
    name: "Diamond Tier",
    minDeposit: 50000,
    maxDeposit: 10000000,
    durationDays: 30,
    roiPercent: 48,
    roiCapPercent: 48,
    description: "Our highest-level institutional allocation. Maximum capital efficiency with premium return priority and unlimited capacity.",
    status: "active",
    enabled: true,
    displayOrder: 50,
    badge: "Elite VIP",
    accentColor: "#22d3ee"
  }
];

export const normalizeInvestmentPlan = (id: string, data: Partial<InvestmentPlan> | any): InvestmentPlan => {
  const status = data.status === "paused" || data.enabled === false ? "paused" : "active";
  const roiPercent = typeof data.roiPercent === "number" ? data.roiPercent : 0;

  return {
    id,
    name: typeof data.name === "string" ? data.name : "Untitled Plan",
    minDeposit: typeof data.minDeposit === "number" ? data.minDeposit : 0,
    maxDeposit: typeof data.maxDeposit === "number" ? data.maxDeposit : 0,
    durationDays: typeof data.durationDays === "number" ? data.durationDays : 0,
    roiPercent,
    roiCapPercent: typeof data.roiCapPercent === "number" ? data.roiCapPercent : roiPercent,
    description: typeof data.description === "string" ? data.description : "",
    status,
    enabled: data.enabled !== false && status === "active",
    displayOrder: typeof data.displayOrder === "number" ? data.displayOrder : 0,
    badge: typeof data.badge === "string" && data.badge.trim() ? data.badge : undefined,
    accentColor: typeof data.accentColor === "string" && data.accentColor.trim() ? data.accentColor : undefined
  };
};

export const sortInvestmentPlans = (plans: InvestmentPlan[]) =>
  [...plans].sort((a, b) => {
    if (a.displayOrder !== b.displayOrder) return a.displayOrder - b.displayOrder;
    return a.minDeposit - b.minDeposit;
  });

export const getEnabledInvestmentPlans = (plans: InvestmentPlan[]) =>
  sortInvestmentPlans(plans.filter((plan) => plan.enabled && plan.status === "active"));

const DAY_MS = 24 * 60 * 60 * 1000;

const parseInvestmentTimestamp = (value: string) => {
  const timestamp = Date.parse(value);
  if (Number.isFinite(timestamp)) return timestamp;
  return Date.parse(`${value}T00:00:00.000Z`);
};

const investmentDurationMs = (investment: Pick<ActiveInvestment, "startDate" | "endDate">) => {
  const start = parseInvestmentTimestamp(investment.startDate);
  const end = parseInvestmentTimestamp(investment.endDate);
  return Math.max(end - start, DAY_MS);
};

export const isInvestmentRunning = (investment: Pick<ActiveInvestment, "status">) =>
  investment.status === "Running" || investment.status === INVESTMENT_STATUSES.ACTIVE;

export const isInvestmentCompleted = (investment: Pick<ActiveInvestment, "status">) =>
  investment.status === "Completed" || investment.status === INVESTMENT_STATUSES.COMPLETED;

export const getInvestmentRemainingDays = (investment: Pick<ActiveInvestment, "endDate">, now = Date.now()) => {
  const end = parseInvestmentTimestamp(investment.endDate);
  return Math.max(0, Math.ceil((end - now) / DAY_MS));
};

export const getInvestmentProgress = (investment: Pick<ActiveInvestment, "startDate" | "endDate">, now = Date.now()) => {
  const start = parseInvestmentTimestamp(investment.startDate);
  const elapsed = Math.max(0, now - start);
  return Math.min(100, roundMoney((elapsed / investmentDurationMs(investment)) * 100));
};

export const getInvestmentAccruedProfit = (investment: Pick<ActiveInvestment, "startDate" | "endDate"> & { expectedProfit: number }, now = Date.now()) =>
  roundMoney(investment.expectedProfit * (getInvestmentProgress(investment, now) / 100));

export const normalizeActiveInvestment = (
  investment: ActiveInvestment,
  plan?: InvestmentPlan,
  now = Date.now()
): ActiveInvestment => {
  if (investment.status === "cancelled") return investment;

  const roiPercent = typeof investment.roiPercent === "number"
    ? investment.roiPercent
    : typeof plan?.roiPercent === "number"
      ? plan.roiPercent
      : typeof investment.dailyRoiPercent === "number"
        ? roundMoney(investment.dailyRoiPercent * Math.max(1, Math.round(investmentDurationMs(investment) / DAY_MS)))
        : 0;
  const expectedProfit = typeof investment.expectedProfit === "number"
    ? investment.expectedProfit
    : roundMoney(investment.amount * (roiPercent / 100));
  const totalReturn = typeof investment.totalReturn === "number"
    ? investment.totalReturn
    : roundMoney(investment.amount + expectedProfit);
  const progress = getInvestmentProgress(investment, now);
  const matured = getInvestmentRemainingDays(investment, now) === 0 || progress >= 100;
  const completed = isInvestmentCompleted(investment) || Boolean(investment.payoutTransactionId) || Boolean(investment.completedAt) || matured;

  return {
    ...investment,
    roiPercent,
    expectedProfit,
    totalReturn,
    remainingDays: completed ? 0 : getInvestmentRemainingDays(investment, now),
    accumulatedProfit: completed ? (expectedProfit ?? 0) : getInvestmentAccruedProfit({ ...investment, expectedProfit }, now),
    status: completed ? "Completed" : "Running",
    progress: completed ? 100 : progress,
    dailyRoiPercent: investment.dailyRoiPercent ?? (plan?.durationDays ? +(roiPercent / plan.durationDays).toFixed(3) : undefined)
  };
};

export const syncInvestmentCountdowns = (
  investments: ActiveInvestment[],
  plans: InvestmentPlan[],
  now = Date.now()
) => investments.map((investment) => normalizeActiveInvestment(
  investment,
  plans.find((plan) => plan.id === investment.planId),
  now
));

export const settleMaturedInvestments = (
  investments: ActiveInvestment[],
  plans: InvestmentPlan[],
  userEmail?: string | null,
  now = Date.now()
) => {
  const payoutTransactions: Transaction[] = [];
  let payoutAmount = 0;

  const settledInvestments = syncInvestmentCountdowns(investments, plans, now).map((investment) => {
    if (!isInvestmentCompleted(investment) || investment.payoutTransactionId) return investment;

    const payoutTx = buildPayoutTransaction(
      investment.totalReturn,
      `Matured subscription payout of ${investment.name}`,
      userEmail,
      investment.id
    );
    payoutTransactions.push(payoutTx);
    payoutAmount = roundMoney(payoutAmount + investment.totalReturn);

    return {
      ...investment,
      accumulatedProfit: investment.expectedProfit ?? 0,
      completedAt: new Date(now).toISOString(),
      payoutTransactionId: payoutTx.id,
      remainingDays: 0,
      progress: 100,
      status: "Completed" as const
    };
  });

  return {
    investments: settledInvestments,
    transactions: payoutTransactions,
    payoutAmount,
    settledCount: payoutTransactions.length
  };
};
export const buildActiveInvestment = (plan: InvestmentPlan, amount: number): ActiveInvestment => {
  const start = new Date();
  const end = new Date(start.getTime() + plan.durationDays * DAY_MS);
  const expectedProfit = roundMoney(amount * (plan.roiPercent / 100));

  return {
    id: timestampId("act-invest"),
    planId: plan.id,
    name: plan.name,
    amount: roundMoney(amount),
    startDate: start.toISOString(),
    endDate: end.toISOString(),
    roiPercent: plan.roiPercent,
    expectedProfit,
    totalReturn: roundMoney(amount + expectedProfit),
    remainingDays: plan.durationDays,
    accumulatedProfit: 0,
    status: "Running",
    progress: 0,
    dailyRoiPercent: +(plan.roiPercent / plan.durationDays).toFixed(3)
  };
};

export const buildInvestmentTransaction = (
  amount: number,
  planName: string,
  userEmail?: string | null,
  relatedReferenceId?: string
): Transaction => {
  const id = relatedReferenceId ? `tx-plan-${relatedReferenceId}` : timestampId("tx-plan");

  return enrichTransaction({
    id,
    type: "investment",
    amount,
    status: TRANSACTION_STATUSES.COMPLETED,
    asset: DEFAULT_CURRENCY,
    date: todayIsoDate(),
    notes: `Subscribed to portfolio ${planName}`,
    userEmail: userEmail || "system"
  }, { userEmail }, { relatedReferenceId: relatedReferenceId || id });
};

export const buildPayoutTransaction = (
  amount: number,
  notes: string,
  userEmail?: string | null,
  relatedReferenceId?: string
): Transaction => {
  const id = relatedReferenceId ? `tx-pay-${relatedReferenceId}` : timestampId("tx-pay");

  return enrichTransaction({
    id,
    type: "payout",
    amount,
    status: TRANSACTION_STATUSES.COMPLETED,
    asset: DEFAULT_CURRENCY,
    date: todayIsoDate(),
    notes,
    userEmail: userEmail || "system"
  }, { userEmail }, { relatedReferenceId: relatedReferenceId || id });
};

export const buildTopUpTransaction = (
  amount: number,
  investmentName: string,
  userEmail: string,
  relatedReferenceId?: string
): Transaction => {
  const id = timestampId("tx-topup");

  return enrichTransaction({
    id,
    type: "investment",
    amount,
    status: TRANSACTION_STATUSES.COMPLETED,
    asset: DEFAULT_CURRENCY,
    date: todayIsoDate(),
    notes: `Top-up added to ${investmentName}`,
    userEmail: userEmail || FALLBACK_GUEST_EMAIL
  }, { userEmail }, { relatedReferenceId: relatedReferenceId || id });
};