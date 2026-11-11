import type { Dataset, Order, Product } from "@/types/domain";
import {
  addDays,
  monthKey,
  monthKeysBack,
  monthStartOffset,
} from "@/lib/dates";
import { isRevenueOrder, periodStart } from "@/lib/analytics/metrics";

export interface ProductMetric {
  product: Product;
  orderCount: number;
  revenue: number;
  marginPct: number;
  repeatOrders: number;
  repeatShare: number;
  monthlyOrders: number[];
  peakMonthKey: string;
  peakMonthOrders: number;
  lastOrderAt: Date | null;
  ordersLast30: number;
  isDiscontinued: boolean;
}

export interface ProductMonthPoint {
  key: string;
  orders: number;
  revenue: number;
}

export interface ProductAnalytics {
  rows: ProductMetric[];
  months: ProductMonthPoint[];
  peakMonthKey: string;
  totalRevenue: number;
  weightedMarginPct: number;
  repeatShare: number;
  discontinued: ProductMetric[];
}

export function buildProductAnalytics(dataset: Dataset, now: Date): ProductAnalytics {
  const periodFrom = monthStartOffset(now, 11);
  const last30From = periodStart(now, 30);
  const monthKeys = monthKeysBack(now, 12);
  const ordersByClient = new Map<string, Order[]>();

  for (const order of dataset.orders) {
    const rows = ordersByClient.get(order.clientId);
    if (rows) {
      rows.push(order);
    } else {
      ordersByClient.set(order.clientId, [order]);
    }
  }
  for (const rows of ordersByClient.values()) {
    rows.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  const paidOrders = dataset.orders.filter(
    (order) =>
      isRevenueOrder(order) &&
      order.paidAt !== null &&
      order.paidAt.getTime() >= periodFrom.getTime() &&
      order.paidAt.getTime() <= now.getTime(),
  );

  const rows: ProductMetric[] = dataset.products.map((product) => {
    const productOrders = paidOrders.filter((order) => order.productId === product.id);
    const revenue = productOrders.reduce((sum, order) => sum + order.amount, 0);
    const monthlyOrders = monthKeys.map(
      (key) => productOrders.filter((order) => monthKey(order.paidAt!) === key).length,
    );
    let peakIndex = 0;
    let peakOrders = 0;
    monthlyOrders.forEach((count, index) => {
      if (count > peakOrders) {
        peakOrders = count;
        peakIndex = index;
      }
    });
    const repeatOrders = productOrders.filter((order) => {
      const clientOrders = ordersByClient.get(order.clientId) ?? [];
      return clientOrders.some(
        (other) =>
          other.id !== order.id && other.createdAt.getTime() < order.createdAt.getTime(),
      );
    }).length;
    const allProductOrders = dataset.orders.filter(
      (order) => order.productId === product.id && order.paidAt !== null,
    );
    const lastOrderAt =
      allProductOrders.length > 0
        ? allProductOrders
            .slice()
            .sort((a, b) => b.paidAt!.getTime() - a.paidAt!.getTime())[0]!.paidAt
        : null;
    return {
      product,
      orderCount: productOrders.length,
      revenue,
      marginPct: (product.price - product.cost) / product.price,
      repeatOrders,
      repeatShare: productOrders.length > 0 ? repeatOrders / productOrders.length : 0,
      monthlyOrders,
      peakMonthKey: monthKeys[peakIndex] ?? monthKeys[monthKeys.length - 1]!,
      peakMonthOrders: peakOrders,
      lastOrderAt,
      ordersLast30: productOrders.filter(
        (order) => order.paidAt!.getTime() >= last30From.getTime(),
      ).length,
      isDiscontinued:
        lastOrderAt === null || lastOrderAt.getTime() < addDays(now, -60).getTime(),
    };
  });

  const months: ProductMonthPoint[] = monthKeys.map((key) => {
    const monthOrders = paidOrders.filter((order) => monthKey(order.paidAt!) === key);
    return {
      key,
      orders: monthOrders.length,
      revenue: monthOrders.reduce((sum, order) => sum + order.amount, 0),
    };
  });
  let peakMonthKey = months[0]?.key ?? monthKeys[0]!;
  let peakOrders = -1;
  for (const month of months) {
    if (month.orders > peakOrders) {
      peakOrders = month.orders;
      peakMonthKey = month.key;
    }
  }

  const totalRevenue = paidOrders.reduce((sum, order) => sum + order.amount, 0);
  const totalCost = paidOrders.reduce((sum, order) => sum + order.cost, 0);
  const repeatCount = rows.reduce((sum, row) => sum + row.repeatOrders, 0);
  const orderCount = rows.reduce((sum, row) => sum + row.orderCount, 0);

  return {
    rows,
    months,
    peakMonthKey,
    totalRevenue,
    weightedMarginPct:
      totalRevenue > 0 ? (totalRevenue - totalCost) / totalRevenue : 0,
    repeatShare: orderCount > 0 ? repeatCount / orderCount : 0,
    discontinued: rows
      .filter((row) => row.isDiscontinued)
      .sort((a, b) => {
        const aTime = a.lastOrderAt?.getTime() ?? 0;
        const bTime = b.lastOrderAt?.getTime() ?? 0;
        return aTime - bTime;
      }),
  };
}
