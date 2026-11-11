import type { Client, Dataset, Order } from "@/types/domain";
import {
  dayStart,
  moscowDayIndex,
  monthKey,
  monthKeysBack,
  monthStartOffset,
} from "@/lib/dates";
import { isRevenueOrder } from "@/lib/analytics/metrics";

export type AbcClass = "A" | "B" | "C";
export type XyzClass = "X" | "Y" | "Z";

export interface CustomerMetric {
  client: Client;
  revenue: number;
  orderCount: number;
  averageCheck: number;
  lastOrderAt: Date | null;
  ltv: number;
  repeatOrders: number;
  abc: AbcClass;
  xyz: XyzClass;
  monthlyOrders: number[];
}

export interface AbcXyzCell {
  abc: AbcClass;
  xyz: XyzClass;
  clients: number;
  revenue: number;
  revenueShare: number;
}

export interface CustomerAnalytics {
  rows: CustomerMetric[];
  matrix: AbcXyzCell[];
  totalRevenue: number;
  activeClients: number;
  repeatSalesShare: number;
  averageLtv: number;
  topClientsShare: number;
}

export function coefficientOfVariation(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  if (mean === 0) return 0;
  const variance =
    values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance) / mean;
}

export function xyzClass(cv: number, meanOrders: number): XyzClass {
  if (meanOrders === 0) return "Z";
  if (cv < 0.33) return "X";
  if (cv < 0.66) return "Y";
  return "Z";
}

export function buildCustomerAnalytics(dataset: Dataset, now: Date): CustomerAnalytics {
  const periodFrom = monthStartOffset(now, 11);
  const activeFrom = dayStart(moscowDayIndex(now) - 89);
  const monthKeys = monthKeysBack(now, 6);
  const ordersByClient = new Map<string, Order[]>();

  for (const order of dataset.orders) {
    const rows = ordersByClient.get(order.clientId);
    if (rows) {
      rows.push(order);
    } else {
      ordersByClient.set(order.clientId, [order]);
    }
  }

  const rows: CustomerMetric[] = dataset.clients.map((client) => {
    const clientOrders = (ordersByClient.get(client.id) ?? []).slice().sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    );
    const paidOrders = clientOrders.filter(
      (order) =>
        isRevenueOrder(order) &&
        order.paidAt !== null &&
        order.paidAt.getTime() >= periodFrom.getTime() &&
        order.paidAt.getTime() <= now.getTime(),
    );
    const revenue = paidOrders.reduce((sum, order) => sum + order.amount, 0);
    const lastOrderAt =
      clientOrders.length > 0 ? clientOrders[clientOrders.length - 1]!.createdAt : null;
    const firstOrderAt = clientOrders[0]?.createdAt ?? null;
    const repeatOrders =
      firstOrderAt === null
        ? 0
        : clientOrders.filter(
            (order) =>
              order.createdAt.getTime() > firstOrderAt.getTime() &&
              order.createdAt.getTime() >= periodFrom.getTime(),
          ).length;

    const monthlyOrders = monthKeys.map(
      (key) =>
        clientOrders.filter(
          (order) =>
            monthKey(order.createdAt) === key && order.createdAt.getTime() >= periodFrom.getTime(),
        ).length,
    );
    const meanMonthly =
      monthlyOrders.reduce((sum, value) => sum + value, 0) / (monthlyOrders.length || 1);
    const xyz = xyzClass(coefficientOfVariation(monthlyOrders), meanMonthly);

    return {
      client,
      revenue,
      orderCount: paidOrders.length,
      averageCheck: paidOrders.length > 0 ? revenue / paidOrders.length : 0,
      lastOrderAt,
      ltv: revenue,
      repeatOrders,
      abc: "C",
      xyz,
      monthlyOrders,
    };
  });

  const totalRevenue = rows.reduce((sum, row) => sum + row.revenue, 0);
  const sorted = rows.slice().sort((a, b) => b.revenue - a.revenue);
  let cumulative = 0;
  for (const row of sorted) {
    cumulative += row.revenue;
    const share = totalRevenue > 0 ? cumulative / totalRevenue : 1;
    row.abc = share <= 0.8 ? "A" : share <= 0.95 ? "B" : "C";
  }

  const matrix: AbcXyzCell[] = [];
  for (const abc of ["A", "B", "C"] as AbcClass[]) {
    for (const xyz of ["X", "Y", "Z"] as XyzClass[]) {
      const cellClients = rows.filter((row) => row.abc === abc && row.xyz === xyz);
      const cellRevenue = cellClients.reduce((sum, row) => sum + row.revenue, 0);
      matrix.push({
        abc,
        xyz,
        clients: cellClients.length,
        revenue: cellRevenue,
        revenueShare: totalRevenue > 0 ? cellRevenue / totalRevenue : 0,
      });
    }
  }

  const twelveMonthOrders = dataset.orders.filter(
    (order) => order.createdAt.getTime() >= periodFrom.getTime(),
  );
  const repeatWindowOrders = twelveMonthOrders.filter((order) => {
    const clientOrders = ordersByClient.get(order.clientId) ?? [];
    return clientOrders.some(
      (other) =>
        other.id !== order.id && other.createdAt.getTime() < order.createdAt.getTime(),
    );
  });

  const clientsWithOrders = rows.filter((row) => row.orderCount > 0);
  const topClientsRevenue = sorted
    .slice(0, 5)
    .reduce((sum, row) => sum + row.revenue, 0);

  return {
    rows: sorted,
    matrix,
    totalRevenue,
    activeClients: new Set(
      dataset.orders
        .filter((order) => order.createdAt.getTime() >= activeFrom.getTime())
        .map((order) => order.clientId),
    ).size,
    repeatSalesShare:
      twelveMonthOrders.length > 0
        ? repeatWindowOrders.length / twelveMonthOrders.length
        : 0,
    averageLtv:
      clientsWithOrders.length > 0
        ? clientsWithOrders.reduce((sum, row) => sum + row.ltv, 0) /
          clientsWithOrders.length
        : 0,
    topClientsShare: totalRevenue > 0 ? topClientsRevenue / totalRevenue : 0,
  };
}
