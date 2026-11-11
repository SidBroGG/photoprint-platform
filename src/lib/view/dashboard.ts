import type { DemoAccount } from "@/lib/auth/roles";
import { canSeeOrderMoney, dashboardDomains, type DashboardDomain } from "@/lib/auth/roles";
import { getDataset } from "@/lib/data/store";
import { buildAlerts, type AlertDomain } from "@/lib/analytics/alerts";
import { buildForecast } from "@/lib/analytics/forecast";
import {
  countOrdersToday,
  deliveryStats,
  orderPipeline,
  overdueProductionOrders,
  overdueTickets,
  periodStart,
  revenueSummary,
  serviceStats,
} from "@/lib/analytics/metrics";
import { formatDateTime, formatMoneyCompact, formatNumber, formatPercent } from "@/lib/format";

export interface KpiVM {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "success" | "warning" | "error" | "info" | "accent";
}

export interface PipelineVM {
  key: string;
  label: string;
  count: number;
  amount?: string;
}

export interface AlertVM {
  id: string;
  severity: "critical" | "warning";
  severityLabel: string;
  title: string;
  where: string;
  reason: string;
  action: string;
  owner: string;
  due: string;
  href: string;
  domainLabel: string;
}

export interface ForecastRiskVM {
  id: string;
  title: string;
  reason: string;
  action: string;
  horizon: string;
  severity: "critical" | "warning";
}

export interface DashboardView {
  meta: string;
  roleNote: string;
  kpis: KpiVM[];
  stages: PipelineVM[];
  showAmounts: boolean;
  alerts: AlertVM[];
  forecastRisks: ForecastRiskVM[];
}

const DOMAIN_LABELS: Record<AlertDomain, string> = {
  sales: "Продажи",
  production: "Производство",
  logistics: "Логистика",
  service: "Сервис",
};

const ROLE_NOTES: Record<string, string> = {
  ceo: "Полный срез компании: продажи, финансы, производство, логистика и сервис.",
  sales: "Срез направления: продажи, финансы, клиенты и продукты.",
  production: "Срез направления: производство и сроки изготовления.",
  logistics_service: "Срез направления: доставка, обращения и SLA.",
};

export function getDashboardView(account: DemoAccount, now: Date = new Date()): DashboardView {
  const dataset = getDataset(now);
  const domains = dashboardDomains(account.role);
  const has = (domain: DashboardDomain) => domains.includes(domain);
  const isCeo = account.role === "ceo";

  const revenue30 = revenueSummary(dataset.orders, periodStart(now, 30), now);
  const todayCount = countOrdersToday(dataset.orders, now);
  const productionOrders = dataset.orders.filter(
    (order) =>
      order.stage === "prepress" || order.stage === "print" || order.stage === "binding",
  );
  const overdueProduction = overdueProductionOrders(dataset.orders, now);
  const ready = dataset.orders.filter((order) => order.stage === "ready");
  const deliveries = deliveryStats(dataset.shipments, now);
  const tickets = serviceStats(dataset.tickets, now);
  const syncErrors = dataset.orders.filter((order) => order.paymentStatus === "sync_error");
  const complianceDone = dataset.orders.filter(
    (order) =>
      order.productionCompletedAt !== null &&
      order.productionCompletedAt.getTime() >= periodStart(now, 30).getTime(),
  );
  const complianceOnTime = complianceDone.filter(
    (order) => order.productionCompletedAt!.getTime() <= order.dueAt.getTime(),
  );
  const compliance =
    complianceDone.length > 0 ? complianceOnTime.length / complianceDone.length : 0;

  const kpis: KpiVM[] = [];
  if (isCeo || has("sales") || has("finance")) {
    kpis.push({
      label: "Заказы сегодня",
      value: formatNumber(todayCount),
      hint: "Созданы за текущий день",
    });
    kpis.push({
      label: "Выручка, 30 дней",
      value: formatMoneyCompact(revenue30.revenue),
      hint: `${formatNumber(revenue30.orderCount)} оплаченных заказов`,
    });
    kpis.push({
      label: "Маржа, 30 дней",
      value: formatMoneyCompact(revenue30.margin),
      hint: `${formatPercent(revenue30.marginPct, 1)} выручки`,
      tone: "accent",
    });
    kpis.push({
      label: "Ошибки оплаты",
      value: formatNumber(syncErrors.length),
      hint: "Не синхронизировано с ERP/1С",
      tone: syncErrors.length > 0 ? "error" : "default",
    });
  }
  if (isCeo || has("production")) {
    kpis.push({
      label: "В производстве",
      value: formatNumber(productionOrders.length),
      hint: "Активные этапы производства",
    });
    kpis.push({
      label: "Просрочено",
      value: formatNumber(overdueProduction.length),
      hint: "Срок изготовления истёк",
      tone: overdueProduction.length > 0 ? "error" : "default",
    });
    kpis.push({
      label: "Готовы к отправке",
      value: formatNumber(ready.length),
      hint: "Ожидают передачи в доставку",
    });
    kpis.push({
      label: "Соблюдение срока",
      value: formatPercent(compliance, 0),
      hint: "Завершено за 30 дней в срок",
      tone: compliance >= 0.9 ? "success" : compliance >= 0.8 ? "warning" : "error",
    });
  }
  if (isCeo || has("logistics") || has("service")) {
    kpis.push({
      label: "В доставке",
      value: formatNumber(deliveries.inTransit),
      hint: "Отправления в пути",
    });
    kpis.push({
      label: "Задержки доставки",
      value: formatNumber(deliveries.overdue),
      hint: "ETA прошла, вручения нет",
      tone: deliveries.overdue > 0 ? "error" : "default",
    });
    kpis.push({
      label: "Открытые обращения",
      value: formatNumber(tickets.open),
      hint: "Открыто и в работе",
    });
    kpis.push({
      label: "Просрочка SLA",
      value: formatNumber(overdueTickets(dataset.tickets, now).length),
      hint: "Срок первого ответа истёк",
      tone: overdueTickets(dataset.tickets, now).length > 0 ? "error" : "default",
    });
  }

  const ceoKpis: KpiVM[] = [
    {
      label: "Заказы сегодня",
      value: formatNumber(todayCount),
      hint: "Созданы за текущий день",
    },
    {
      label: "Выручка, 30 дней",
      value: formatMoneyCompact(revenue30.revenue),
      hint: `${formatNumber(revenue30.orderCount)} оплаченных заказов`,
    },
    {
      label: "Маржа, 30 дней",
      value: formatMoneyCompact(revenue30.margin),
      hint: `${formatPercent(revenue30.marginPct, 1)} выручки`,
      tone: "accent",
    },
    {
      label: "В производстве",
      value: formatNumber(productionOrders.length),
      hint: "Активные этапы производства",
    },
    {
      label: "Просрочено",
      value: formatNumber(overdueProduction.length),
      hint: "Срок изготовления истёк",
      tone: overdueProduction.length > 0 ? "error" : "default",
    },
    {
      label: "В доставке",
      value: formatNumber(deliveries.inTransit),
      hint: "Отправления в пути",
    },
    {
      label: "Открытые обращения",
      value: formatNumber(tickets.open),
      hint: "Открыто и в работе",
    },
    {
      label: "Просрочка SLA",
      value: formatNumber(overdueTickets(dataset.tickets, now).length),
      hint: "Срок первого ответа истёк",
      tone: overdueTickets(dataset.tickets, now).length > 0 ? "error" : "default",
    },
  ];

  const pipeline = orderPipeline(dataset.orders, now);
  const stageKeys = isCeo
    ? ["order", "payment", "production", "ready", "delivery", "delivered"]
    : has("sales")
      ? ["order", "payment", "delivered"]
      : has("production")
        ? ["production", "ready"]
        : ["delivery", "delivered"];
  const showAmounts = canSeeOrderMoney(account.role);
  const stages: PipelineVM[] = pipeline
    .filter((bucket) => stageKeys.includes(bucket.key))
    .map((bucket) => ({
      key: bucket.key,
      label: bucket.label,
      count: bucket.count,
      amount: showAmounts ? formatMoneyCompact(bucket.amount) : undefined,
    }));

  const allowedDomains = new Set<AlertDomain>();
  if (has("sales") || has("finance")) allowedDomains.add("sales");
  if (has("production")) allowedDomains.add("production");
  if (has("logistics")) allowedDomains.add("logistics");
  if (has("service")) allowedDomains.add("service");

  const alerts: AlertVM[] = buildAlerts(dataset, now)
    .filter((alert) => allowedDomains.has(alert.domain))
    .slice(0, 20)
    .map((alert) => ({
      id: alert.id,
      severity: alert.severity,
      severityLabel: alert.severity === "critical" ? "Критично" : "Предупреждение",
      title: alert.title,
      where: alert.where,
      reason: alert.reason,
      action: alert.action,
      owner: alert.owner,
      due: formatDateTime(alert.due),
      href: alert.href,
      domainLabel: DOMAIN_LABELS[alert.domain],
    }));

  const forecast = buildForecast(dataset, now);
  const forecastRisks: ForecastRiskVM[] = forecast.risks
    .filter((risk) => (risk.domain === "production" ? has("production") : has("service")))
    .slice(0, 2)
    .map((risk) => ({
      id: risk.id,
      title: risk.title,
      reason: risk.reason,
      action: risk.action,
      horizon: risk.horizon,
      severity: risk.severity,
    }));

  return {
    meta: `Данные на ${formatDateTime(now)} · Europe/Moscow · демо-набор`,
    roleNote: ROLE_NOTES[account.role] ?? "Срез направления.",
    kpis: isCeo ? ceoKpis : kpis,
    stages,
    showAmounts,
    alerts,
    forecastRisks,
  };
}
