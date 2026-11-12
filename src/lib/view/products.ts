import { getDataset } from "@/lib/data/store";
import { buildProductAnalytics } from "@/lib/analytics/products";
import { monthKeyLabel } from "@/lib/dates";
import { formatDate, formatMoney, formatMoneyCompact, formatNumber, formatPercent } from "@/lib/format";
import type { Tone } from "@/lib/labels";
import type { KpiVM } from "@/lib/view/dashboard";

export interface ProductRowVM {
  id: string;
  name: string;
  categoryLabel: string;
  priceLabel: string;
  orders: number;
  revenueLabel: string;
  marginLabel: string;
  repeatShareLabel: string;
  peakLabel: string;
  statusLabel: string;
  statusTone: Tone;
}

export interface DiscontinuedRowVM {
  id: string;
  name: string;
  lastOrderLabel: string;
  orders: number;
  marginLabel: string;
}

export interface ProductsView {
  meta: string;
  kpis: KpiVM[];
  chart: {
    labels: string[];
    orders: number[];
    peakLabel: string;
  };
  rows: ProductRowVM[];
  discontinued: DiscontinuedRowVM[];
}

const CATEGORY_LABELS: Record<string, string> = {
  photobooks: "Фотокниги",
  photoproducts: "Фотопродукция",
};

export function getProductsView(now: Date = new Date()): ProductsView {
  const dataset = getDataset(now);
  const analytics = buildProductAnalytics(dataset, now);
  const peakLabel = monthKeyLabel(analytics.peakMonthKey);

  const rows: ProductRowVM[] = analytics.rows
    .slice()
    .sort((a, b) => b.revenue - a.revenue)
    .map((row) => {
      const statusLabel =
        row.product.status === "discontinued"
          ? "Снят с производства"
          : row.isDiscontinued
            ? "Выбывший"
            : "Активен";
      const statusTone: Tone =
        row.product.status === "discontinued"
          ? "warning"
          : row.isDiscontinued
            ? "neutral"
            : "success";
      return {
        id: row.product.id,
        name: row.product.name,
        categoryLabel: CATEGORY_LABELS[row.product.category] ?? row.product.category,
        priceLabel: formatMoney(row.product.price),
        orders: row.orderCount,
        revenueLabel: formatMoney(row.revenue),
        marginLabel: formatPercent(row.marginPct, 1),
        repeatShareLabel: formatPercent(row.repeatShare, 0),
        peakLabel: monthKeyLabel(row.peakMonthKey),
        statusLabel,
        statusTone,
      };
    });

  return {
    meta: `12 месяцев · маржа по каталогу · выбывший продукт — 0 заказов за 60 дней · ${formatNumber(rows.length)} позиций`,
    kpis: [
      {
        label: "Выручка, 12 месяцев",
        value: formatMoneyCompact(analytics.totalRevenue),
        hint: "Оплаченные заказы",
      },
      {
        label: "Маржинальность",
        value: formatPercent(analytics.weightedMarginPct, 1),
        hint: "Фактическая маржа по выручке",
        tone: "accent",
      },
      {
        label: "Выбывшие позиции",
        value: formatNumber(analytics.discontinued.length),
        hint: "Нет заказов более 60 дней",
        tone: analytics.discontinued.length > 0 ? "warning" : "default",
      },
      {
        label: "Повторные заказы",
        value: formatPercent(analytics.repeatShare, 0),
        hint: "Доля заказов возвращающихся клиентов",
      },
    ],
    chart: {
      labels: analytics.months.map((month) => monthKeyLabel(month.key)),
      orders: analytics.months.map((month) => month.orders),
      peakLabel,
    },
    rows,
    discontinued: analytics.discontinued.map((row) => ({
      id: row.product.id,
      name: row.product.name,
      lastOrderLabel: row.lastOrderAt ? formatDate(row.lastOrderAt) : "Нет заказов",
      orders: row.orderCount,
      marginLabel: formatPercent(row.marginPct, 1),
    })),
  };
}
