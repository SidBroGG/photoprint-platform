import type { Dataset, ProductionStage } from "@/types/domain";
import { PRODUCTION_STAGES, STAGE_CAPACITY } from "@/types/domain";
import {
  dayStart,
  moscowDayIndex,
  monthKeysBack,
  mondayIndex,
  MSK_OFFSET_MS,
} from "@/lib/dates";
import {
  isRevenueOrder,
  overdueTickets,
  periodStart,
} from "@/lib/analytics/metrics";
import { STAGE_LABELS } from "@/lib/labels";

export interface DailyForecastPoint {
  date: Date;
  orders: number;
  revenue: number;
  shipments: number;
}

export interface OverloadWeek {
  weekStart: Date;
  days: number;
}

export interface StageRiskSummary {
  stage: ProductionStage;
  label: string;
  capacity: number;
  averageDemand: number;
  maxDemand: number;
  overloadDays14: number;
  overloadWeeks: OverloadWeek[];
}

export interface LongTermMonthPoint {
  key: string;
  orders: number;
  revenue: number;
  isForecast: boolean;
}

export interface ForecastRisk {
  id: string;
  title: string;
  reason: string;
  action: string;
  severity: "warning" | "critical";
  horizon: string;
  domain: "production" | "service";
}

export interface ForecastView {
  daily: DailyForecastPoint[];
  stageRisks: StageRiskSummary[];
  longTerm: LongTermMonthPoint[];
  deliveryShare: number;
  risks: ForecastRisk[];
}

export function linearRegression(values: number[]): { intercept: number; slope: number } {
  const count = values.length;
  if (count === 0) return { intercept: 0, slope: 0 };
  if (count === 1) return { intercept: values[0]!, slope: 0 };
  const xMean = (count - 1) / 2;
  const yMean = values.reduce((sum, value) => sum + value, 0) / count;
  let numerator = 0;
  let denominator = 0;
  values.forEach((value, index) => {
    numerator += (index - xMean) * (value - yMean);
    denominator += (index - xMean) ** 2;
  });
  const slope = denominator === 0 ? 0 : numerator / denominator;
  return { intercept: yMean - slope * xMean, slope };
}

function weekdayFactors(values: number[], startDayIndex: number): number[] {
  const regression = linearRegression(values);
  const ratios: number[][] = Array.from({ length: 7 }, () => []);
  values.forEach((value, index) => {
    const trend = Math.max(0.5, regression.intercept + regression.slope * index);
    const weekday = (((startDayIndex + index + 3) % 7) + 7) % 7;
    ratios[weekday]!.push(value / trend);
  });
  const raw = ratios.map((list) =>
    list.length > 0 ? list.reduce((sum, value) => sum + value, 0) / list.length : 1,
  );
  const mean = raw.reduce((sum, value) => sum + value, 0) / 7;
  return raw.map((value) =>
    Math.min(1.5, Math.max(0.5, mean > 0 ? value / mean : 1)),
  );
}

const STAGE_ACTIONS: Record<ProductionStage, string> = {
  prepress: "Усилить смену допечатной подготовки и заранее проверять макеты.",
  print: "Запланировать дополнительную смену печати и проверить загрузку оборудования.",
  binding: "Добавить смену сборки и перенести неприоритетные заказы на более поздний срок.",
};

export function buildForecast(dataset: Dataset, now: Date): ForecastView {
  const todayIndex = moscowDayIndex(now);
  const historyDays = 56;
  const horizon = 21;
  const startDayIndex = todayIndex - historyDays + 1;
  const orderCounts: number[] = Array.from({ length: historyDays }, () => 0);
  const revenues: number[] = Array.from({ length: historyDays }, () => 0);

  for (const order of dataset.orders) {
    const createdIndex = moscowDayIndex(order.createdAt);
    const createdOffset = createdIndex - startDayIndex;
    if (createdOffset >= 0 && createdOffset < historyDays) {
      orderCounts[createdOffset] = (orderCounts[createdOffset] ?? 0) + 1;
    }
    if (isRevenueOrder(order) && order.paidAt) {
      const paidIndex = moscowDayIndex(order.paidAt);
      const paidOffset = paidIndex - startDayIndex;
      if (paidOffset >= 0 && paidOffset < historyDays) {
        revenues[paidOffset] = (revenues[paidOffset] ?? 0) + order.amount;
      }
    }
  }

  const orderRegression = linearRegression(orderCounts);
  const revenueRegression = linearRegression(revenues);
  const factors = weekdayFactors(orderCounts, startDayIndex);

  const recentOrders = dataset.orders.filter(
    (order) => order.createdAt.getTime() >= periodStart(now, 30).getTime(),
  );
  const deliveryShare =
    recentOrders.length > 0
      ? recentOrders.filter((order) => order.deliveryMethod === "delivery").length /
        recentOrders.length
      : 0.8;

  const daily: DailyForecastPoint[] = [];
  for (let index = 0; index < horizon; index += 1) {
    const dayIndex = todayIndex + 1 + index;
    const weekday = (((dayIndex + 3) % 7) + 7) % 7;
    const trendOrders = Math.max(
      0,
      orderRegression.intercept + orderRegression.slope * (historyDays + index),
    );
    const orders = Math.max(0, Math.round(trendOrders * (factors[weekday] ?? 1)));
    const trendRevenue = Math.max(
      0,
      revenueRegression.intercept + revenueRegression.slope * (historyDays + index),
    );
    const revenue = Math.max(
      0,
      Math.round((trendRevenue * (factors[weekday] ?? 1)) / 100) * 100,
    );
    daily.push({
      date: dayStart(dayIndex),
      orders,
      revenue,
      shipments: Math.max(0, Math.round(orders * deliveryShare)),
    });
  }

  const stageRisks: StageRiskSummary[] = PRODUCTION_STAGES.map((stage) => {
    const capacity = STAGE_CAPACITY[stage];
    const overloadDays = daily.filter((point) => point.orders > capacity);
    const weeks = new Map<number, OverloadWeek>();
    for (const point of overloadDays) {
      const weekStartIndex = mondayIndex(point.date);
      const existing = weeks.get(weekStartIndex);
      if (existing) {
        existing.days += 1;
      } else {
        weeks.set(weekStartIndex, { weekStart: dayStart(weekStartIndex), days: 1 });
      }
    }
    const next14 = daily.slice(0, 14);
    return {
      stage,
      label: STAGE_LABELS[stage],
      capacity,
      averageDemand:
        daily.length > 0
          ? daily.reduce((sum, point) => sum + point.orders, 0) / daily.length
          : 0,
      maxDemand: daily.reduce((max, point) => Math.max(max, point.orders), 0),
      overloadDays14: next14.filter((point) => point.orders > capacity).length,
      overloadWeeks: Array.from(weeks.values()).sort(
        (a, b) => a.weekStart.getTime() - b.weekStart.getTime(),
      ),
    };
  });

  const risks: ForecastRisk[] = stageRisks
    .filter((stage) => stage.overloadDays14 > 0)
    .map((stage) => ({
      id: `forecast_overload:${stage.stage}`,
      title: `Риск перегрузки: ${stage.label.toLowerCase()}`,
      reason: `Прогноз в среднем ${stage.averageDemand.toFixed(1).replace(".", ",")} заказов в день при мощности ${stage.capacity}; перегрузка в ${stage.overloadDays14} дн. из 14.`,
      action: STAGE_ACTIONS[stage.stage],
      severity:
        stage.averageDemand > stage.capacity * 1.15
          ? ("critical" as const)
          : ("warning" as const),
      horizon: "1–2 недели",
      domain: "production" as const,
    }));

  const slaOverdue = overdueTickets(dataset.tickets, now).length;
  if (slaOverdue > 0) {
    risks.push({
      id: "forecast_sla:service",
      title: "Риск эскалации SLA",
      reason: `${slaOverdue} обращений уже просрочены; без перераспределения очередь продолжит расти.`,
      action: "Перераспределить обращения между специалистами и ответить клиентам сегодня.",
      severity: slaOverdue >= 3 ? "critical" : "warning",
      horizon: "1–2 недели",
      domain: "service",
    });
  }

  const monthKeys = monthKeysBack(now, 13).slice(0, 12);
  const monthOrders = new Map<string, number>();
  const monthRevenue = new Map<string, number>();
  for (const order of dataset.orders) {
    const key = monthKeyOf(order.createdAt);
    monthOrders.set(key, (monthOrders.get(key) ?? 0) + 1);
    if (isRevenueOrder(order) && order.paidAt) {
      const paidKey = monthKeyOf(order.paidAt);
      monthRevenue.set(paidKey, (monthRevenue.get(paidKey) ?? 0) + order.amount);
    }
  }
  const orderHistory = monthKeys.map((key) => monthOrders.get(key) ?? 0);
  const revenueHistory = monthKeys.map((key) => monthRevenue.get(key) ?? 0);
  const orderMonthRegression = linearRegression(orderHistory);
  const revenueMonthRegression = linearRegression(revenueHistory);
  const orderSeasonality = new Map<number, number>();
  const revenueSeasonality = new Map<number, number>();
  monthKeys.forEach((key, index) => {
    const monthNumber = Number(key.slice(5, 7));
    const orderTrend = Math.max(
      0.5,
      orderMonthRegression.intercept + orderMonthRegression.slope * index,
    );
    const revenueTrend = Math.max(
      0.5,
      revenueMonthRegression.intercept + revenueMonthRegression.slope * index,
    );
    orderSeasonality.set(monthNumber, orderHistory[index]! / orderTrend);
    revenueSeasonality.set(monthNumber, revenueHistory[index]! / revenueTrend);
  });

  const longTerm: LongTermMonthPoint[] = monthKeys.map((key, index) => ({
    key,
    orders: orderHistory[index]!,
    revenue: revenueHistory[index]!,
    isForecast: false,
  }));
  const shiftedNow = new Date(now.getTime() + MSK_OFFSET_MS);
  for (let index = 0; index < 3; index += 1) {
    const date = new Date(
      Date.UTC(shiftedNow.getUTCFullYear(), shiftedNow.getUTCMonth() + index, 1),
    );
    const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
    const monthNumber = date.getUTCMonth() + 1;
    const trendIndex = monthKeys.length + index;
    const orders = Math.max(
      0,
      Math.round(
        (orderMonthRegression.intercept + orderMonthRegression.slope * trendIndex) *
          (orderSeasonality.get(monthNumber) ?? 1),
      ),
    );
    const revenue = Math.max(
      0,
      Math.round(
        ((revenueMonthRegression.intercept +
          revenueMonthRegression.slope * trendIndex) *
          (revenueSeasonality.get(monthNumber) ?? 1)) /
          100,
      ) * 100,
    );
    longTerm.push({ key, orders, revenue, isForecast: true });
  }

  return {
    daily,
    stageRisks,
    longTerm,
    deliveryShare,
    risks,
  };
}

function monthKeyOf(date: Date): string {
  const shifted = new Date(date.getTime() + MSK_OFFSET_MS);
  return `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, "0")}`;
}
