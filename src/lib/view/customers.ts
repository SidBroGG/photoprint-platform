import { getDataset } from "@/lib/data/store";
import { buildCustomerAnalytics, type AbcClass, type XyzClass } from "@/lib/analytics/customers";
import { formatDate, formatMoney, formatMoneyCompact, formatNumber, formatPercent, plural } from "@/lib/format";
import type { KpiVM } from "@/lib/view/dashboard";

export interface CustomerRowVM {
  id: string;
  name: string;
  segment: string;
  revenueLabel: string;
  orders: number;
  averageCheckLabel: string;
  lastOrderLabel: string;
  ltvLabel: string;
  repeatOrders: number;
  abc: AbcClass;
  xyz: XyzClass;
}

export interface MatrixCellVM {
  abc: AbcClass;
  xyz: XyzClass;
  countLabel: string;
  shareLabel: string;
}

export interface CustomersView {
  meta: string;
  kpis: KpiVM[];
  matrix: MatrixCellVM[];
  rows: CustomerRowVM[];
}

export function getCustomersView(now: Date = new Date()): CustomersView {
  const dataset = getDataset(now);
  const analytics = buildCustomerAnalytics(dataset, now);
  const matrix: MatrixCellVM[] = analytics.matrix.map((cell) => ({
    abc: cell.abc,
    xyz: cell.xyz,
    countLabel: `${cell.clients} ${plural(cell.clients, "клиент", "клиента", "клиентов")}`,
    shareLabel: formatPercent(cell.revenueShare, 1),
  }));

  const rows: CustomerRowVM[] = analytics.rows.map((row) => ({
    id: row.client.id,
    name: row.client.name,
    segment: row.client.segment,
    revenueLabel: formatMoney(row.revenue),
    orders: row.orderCount,
    averageCheckLabel: row.orderCount > 0 ? formatMoney(row.averageCheck) : "—",
    lastOrderLabel: row.lastOrderAt ? formatDate(row.lastOrderAt) : "—",
    ltvLabel: formatMoney(row.ltv),
    repeatOrders: row.repeatOrders,
    abc: row.abc,
    xyz: row.xyz,
  }));

  return {
    meta: `12 месяцев · ABC по выручке, XYZ по 6 месяцам заказов · LTV, факт · ${formatNumber(rows.length)} клиентов`,
    kpis: [
      {
        label: "Активные клиенты",
        value: formatNumber(analytics.activeClients),
        hint: "Заказы за последние 90 дней",
      },
      {
        label: "Повторные продажи",
        value: formatPercent(analytics.repeatSalesShare, 0),
        hint: "Доля заказов клиентов с предыдущим заказом",
      },
      {
        label: "Средний LTV, факт",
        value: formatMoneyCompact(analytics.averageLtv),
        hint: "Накопленная выручка за 12 месяцев",
      },
      {
        label: "Доля топ-5 клиентов",
        value: formatPercent(analytics.topClientsShare, 0),
        hint: "От выручки 12 месяцев",
      },
    ],
    matrix,
    rows,
  };
}
