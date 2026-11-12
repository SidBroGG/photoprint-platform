import type { Dataset } from "@/types/domain";
import type {
  MarketingChannel,
  MarketingChannelId,
  MarketingDailyPoint,
  MarketingDataset,
  MarketingTotals,
} from "@/types/marketing";
import { dayStart, moscowDate, moscowDayIndex, weekdayIndex } from "@/lib/dates";
import { getDataset } from "@/lib/data/store";

export const MARKETING_SEED = 20261112;

const WINDOW_DAYS = 30;

interface ChannelDefinition {
  id: MarketingChannelId;
  label: string;
  trafficWeight: number;
  paymentWeight: number;
  selectionRate: number;
  modificationRate: number;
  paymentRate: number;
  newCustomerShare: number;
  cpc: number;
  fixedCost: number;
  checkFactor: number;
}

const CHANNEL_DEFINITIONS: ChannelDefinition[] = [
  {
    id: "organic",
    label: "Органика",
    trafficWeight: 38,
    paymentWeight: 33,
    selectionRate: 0.7,
    modificationRate: 0.4,
    paymentRate: 0.76,
    newCustomerShare: 0.54,
    cpc: 0.35,
    fixedCost: 80,
    checkFactor: 1,
  },
  {
    id: "paid_search",
    label: "Платный поиск",
    trafficWeight: 27,
    paymentWeight: 28,
    selectionRate: 0.64,
    modificationRate: 0.35,
    paymentRate: 0.72,
    newCustomerShare: 0.72,
    cpc: 1.1,
    fixedCost: 1800,
    checkFactor: 0.95,
  },
  {
    id: "social",
    label: "Соцсети",
    trafficWeight: 17,
    paymentWeight: 18,
    selectionRate: 0.61,
    modificationRate: 0.33,
    paymentRate: 0.7,
    newCustomerShare: 0.66,
    cpc: 0.75,
    fixedCost: 900,
    checkFactor: 0.9,
  },
  {
    id: "email",
    label: "Email",
    trafficWeight: 12,
    paymentWeight: 13,
    selectionRate: 0.73,
    modificationRate: 0.45,
    paymentRate: 0.79,
    newCustomerShare: 0.58,
    cpc: 0.25,
    fixedCost: 200,
    checkFactor: 1.05,
  },
  {
    id: "referral",
    label: "Рефералы",
    trafficWeight: 6,
    paymentWeight: 8,
    selectionRate: 0.76,
    modificationRate: 0.47,
    paymentRate: 0.81,
    newCustomerShare: 0.48,
    cpc: 0.35,
    fixedCost: 150,
    checkFactor: 1.2,
  },
];

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function allocate(total: number, weights: number[]): number[] {
  if (total <= 0 || weights.length === 0) return weights.map(() => 0);
  const normalized = weights.map((weight) => Math.max(0, weight));
  const sum = normalized.reduce((accumulator, weight) => accumulator + weight, 0);
  if (sum <= 0) return weights.map(() => 0);

  const raw = normalized.map((weight) => (weight / sum) * total);
  const result = raw.map((value) => Math.floor(value));
  const remainder = total - result.reduce((accumulator, value) => accumulator + value, 0);
  const order = raw
    .map((value, index) => ({ index, fraction: value - Math.floor(value) }))
    .sort((a, b) => b.fraction - a.fraction);

  for (let step = 0; step < remainder; step += 1) {
    const target = order[step % order.length];
    if (!target) break;
    result[target.index] = (result[target.index] ?? 0) + 1;
  }
  return result;
}

interface ChannelDraft {
  definition: ChannelDefinition;
  visits: number;
  templateSelections: number;
  templateModifications: number;
  payments: number;
  newCustomers: number;
  revenue: number;
  cost: number;
}

export function createMarketingDataset(
  dataset: Dataset,
  now: Date = new Date(),
  seed: number = MARKETING_SEED,
): MarketingDataset {
  const rng = mulberry32(seed);
  const todayIndex = moscowDayIndex(now);
  const from = moscowDate(todayIndex - WINDOW_DAYS + 1, 0, 0);
  const dayIndices: number[] = [];
  for (let offset = WINDOW_DAYS - 1; offset >= 0; offset -= 1) {
    dayIndices.push(todayIndex - offset);
  }

  const paidOrders = dataset.orders.filter(
    (order) =>
      (order.paymentStatus === "paid" || order.paymentStatus === "sync_error") &&
      order.paidAt !== null &&
      order.paidAt.getTime() >= from.getTime() &&
      order.paidAt.getTime() <= now.getTime(),
  );
  const totalPayments = paidOrders.length;
  const totalRevenue = paidOrders.reduce((sum, order) => sum + order.amount, 0);

  const paymentsByDay = new Map<number, number>();
  const revenueByDay = new Map<number, number>();
  for (const order of paidOrders) {
    const dayIndex = moscowDayIndex(order.paidAt!);
    paymentsByDay.set(dayIndex, (paymentsByDay.get(dayIndex) ?? 0) + 1);
    revenueByDay.set(dayIndex, (revenueByDay.get(dayIndex) ?? 0) + order.amount);
  }

  const paymentCounts = allocate(
    totalPayments,
    CHANNEL_DEFINITIONS.map((definition) => definition.paymentWeight),
  );

  const drafts: ChannelDraft[] = CHANNEL_DEFINITIONS.map((definition, index) => {
    const payments = paymentCounts[index] ?? 0;
    const conversion =
      definition.selectionRate * definition.modificationRate * definition.paymentRate;
    const baseVisits = conversion > 0 ? Math.round(payments / conversion) : 0;
    const jitter = 0.94 + rng() * 0.12;
    let visits = Math.max(payments, Math.round(baseVisits * jitter));
    let templateSelections = Math.max(
      payments,
      Math.round(visits * definition.selectionRate),
    );
    let templateModifications = Math.max(
      payments,
      Math.round(templateSelections * definition.modificationRate),
    );
    templateSelections = Math.min(
      visits,
      Math.max(templateSelections, templateModifications),
    );
    templateModifications = Math.min(templateSelections, templateModifications);
    visits = Math.max(visits, templateSelections);

    const newCustomers = Math.min(
      payments,
      Math.round(payments * definition.newCustomerShare),
    );
    const cost =
      visits > 0 || payments > 0
        ? Math.round(visits * definition.cpc + definition.fixedCost)
        : 0;

    return {
      definition,
      visits,
      templateSelections,
      templateModifications,
      payments,
      newCustomers,
      revenue: 0,
      cost,
    };
  });

  const revenueCounts = allocate(
    totalRevenue,
    drafts.map((draft) => draft.payments * draft.definition.checkFactor),
  );
  drafts.forEach((draft, index) => {
    draft.revenue = revenueCounts[index] ?? 0;
  });

  const channels: MarketingChannel[] = drafts.map((draft) => ({
    id: draft.definition.id,
    label: draft.definition.label,
    visits: draft.visits,
    templateSelections: draft.templateSelections,
    templateModifications: draft.templateModifications,
    payments: draft.payments,
    newCustomers: draft.newCustomers,
    revenue: draft.revenue,
    cost: draft.cost,
  }));

  const totals = channels.reduce<MarketingTotals>(
    (accumulator, channel) => ({
      visits: accumulator.visits + channel.visits,
      templateSelections:
        accumulator.templateSelections + channel.templateSelections,
      templateModifications:
        accumulator.templateModifications + channel.templateModifications,
      payments: accumulator.payments + channel.payments,
      newCustomers: accumulator.newCustomers + channel.newCustomers,
      revenue: accumulator.revenue + channel.revenue,
      cost: accumulator.cost + channel.cost,
    }),
    {
      visits: 0,
      templateSelections: 0,
      templateModifications: 0,
      payments: 0,
      newCustomers: 0,
      revenue: 0,
      cost: 0,
    },
  );

  const dailyWeights = dayIndices.map((dayIndex) => {
    const payments = paymentsByDay.get(dayIndex) ?? 0;
    const weekday = weekdayIndex(dayStart(dayIndex));
    const weekdayFactor = [1.06, 1.1, 1.03, 1.05, 1, 0.82, 0.76][weekday] ?? 1;
    return Math.max(0.01, (payments + 2) * weekdayFactor * (0.9 + rng() * 0.2));
  });
  const dailyVisits = allocate(totals.visits, dailyWeights);
  const dailySelections = allocate(totals.templateSelections, dailyWeights);
  const dailyModifications = allocate(totals.templateModifications, dailyWeights);
  const dailyCosts = allocate(totals.cost, dailyWeights);

  const daily: MarketingDailyPoint[] = dayIndices.map((dayIndex, index) => ({
    date: dayStart(dayIndex),
    visits: dailyVisits[index] ?? 0,
    templateSelections: dailySelections[index] ?? 0,
    templateModifications: dailyModifications[index] ?? 0,
    payments: paymentsByDay.get(dayIndex) ?? 0,
    revenue: revenueByDay.get(dayIndex) ?? 0,
    cost: dailyCosts[index] ?? 0,
  }));

  return {
    generatedAt: now,
    seed,
    channels,
    daily,
    totals,
  };
}

export function getMarketingDataset(now: Date = new Date()): MarketingDataset {
  return createMarketingDataset(getDataset(now), now);
}
