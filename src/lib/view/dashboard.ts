import type { DemoAccount, Role } from "@/lib/auth/roles";
import {
  canAccess,
  canSeeOrderMoney,
  dashboardDomains,
  type DashboardDomain,
} from "@/lib/auth/roles";
import { getDataset } from "@/lib/data/store";
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
import {
  ISSUE_AREA_LABELS,
  ISSUE_CRITICALITY_LABELS,
  ISSUE_STATUS_LABELS,
  issueCriticalityRank,
  issueCriticalityTone,
  visibleIssueAreas,
} from "@/lib/board/labels";
import { getIssueStore } from "@/lib/board/store";
import { monthKeyLabel } from "@/lib/dates";
import {
  formatDateTime,
  formatDayMonth,
  formatMoneyCompact,
  formatNumber,
  formatPercent,
} from "@/lib/format";
import type { Tone } from "@/lib/labels";
import { STAGE_CAPACITY } from "@/types/domain";
import type { IssueArea } from "@/types/board";
import { getMarketingDashboardView } from "@/lib/view/marketing";

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

export interface ForecastRiskVM {
  id: string;
  title: string;
  reason: string;
  action: string;
  horizon: string;
  severity: "critical" | "warning";
  area: IssueArea;
}

export type DashboardChartVM =
  | {
      chart: "daily";
      key: string;
      title: string;
      subtitle: string;
      labels: string[];
      values: number[];
      label: string;
      valueKind?: "count" | "money";
      color?: string;
    }
  | {
      chart: "stage";
      key: string;
      title: string;
      subtitle: string;
      labels: string[];
      orders: number[];
      capacities: { prepress: number; print: number; binding: number };
    }
  | {
      chart: "shipments";
      key: string;
      title: string;
      subtitle: string;
      labels: string[];
      values: number[];
    }
  | {
      chart: "longTerm";
      key: string;
      title: string;
      subtitle: string;
      labels: string[];
      history: (number | null)[];
      forecast: (number | null)[];
      valueKind?: "count" | "money";
    };

export interface DashboardProblemVM {
  id: string;
  title: string;
  description: string;
  areaLabel: string;
  criticalityLabel: string;
  criticalityTone: Tone;
  statusLabel: string;
  assigneeName: string;
  updatedAtLabel: string;
}

export interface DashboardView {
  meta: string;
  roleNote: string;
  kpis: KpiVM[];
  stages: PipelineVM[];
  showAmounts: boolean;
  forecastRisks: ForecastRiskVM[];
  forecastCharts: DashboardChartVM[];
  problems: DashboardProblemVM[];
  problemsTotal: number;
  problemsHref: string | null;
  showForecastLink: boolean;
}

const ROLE_NOTES: Record<string, string> = {
  ceo: "Полный срез компании: продажи, финансы, производство, логистика и сервис.",
  sales: "Срез направления: продажи, финансы, клиенты и продукты.",
  production: "Срез направления: производство и сроки изготовления.",
  logistics_service: "Срез направления: доставка, обращения и SLA.",
  marketing: "Срез направления: воронка сайта, каналы привлечения и конверсия.",
};

function buildDashboardProblems(
  role: Role,
  now: Date,
): { problems: DashboardProblemVM[]; total: number } {
  const allowedAreas = visibleIssueAreas(role);
  const openIssues = getIssueStore(now).issues
    .filter((issue) => allowedAreas.includes(issue.area) && issue.status !== "done")
    .sort((a, b) => {
      const byCriticality =
        issueCriticalityRank(b.criticality) - issueCriticalityRank(a.criticality);
      if (byCriticality !== 0) return byCriticality;
      return b.updatedAt.getTime() - a.updatedAt.getTime();
    });
  const problems: DashboardProblemVM[] = openIssues.slice(0, 5).map((issue) => ({
    id: issue.id,
    title: issue.title,
    description: issue.description,
    areaLabel: ISSUE_AREA_LABELS[issue.area],
    criticalityLabel: ISSUE_CRITICALITY_LABELS[issue.criticality],
    criticalityTone: issueCriticalityTone(issue.criticality),
    statusLabel: ISSUE_STATUS_LABELS[issue.status],
    assigneeName: issue.assigneeName ?? "Не назначен",
    updatedAtLabel: formatDateTime(issue.updatedAt),
  }));
  return { problems, total: openIssues.length };
}

function getMarketingOverviewView(now: Date): DashboardView {
  const marketing = getMarketingDashboardView(now);
  const { problems, total } = buildDashboardProblems("marketing", now);
  const forecastRisks: ForecastRiskVM[] = [];

  if (marketing.bottleneck) {
    forecastRisks.push({
      id: "marketing_funnel",
      title: `Риск воронки: ${marketing.bottleneck.stageLabel}`,
      reason: `Отвал ${marketing.bottleneck.dropOffLabel} · ${marketing.bottleneck.lostLabel}.`,
      action: marketing.bottleneck.recommendation,
      horizon: "30 дней",
      severity: "critical",
      area: "marketing",
    });
  }
  for (const problem of marketing.channelProblems.slice(0, 1)) {
    forecastRisks.push({
      id: problem.id,
      title: problem.title,
      reason: problem.detail,
      action: problem.action,
      horizon: "30 дней",
      severity: problem.severity,
      area: "marketing",
    });
  }

  const forecastCharts: DashboardChartVM[] = [
    {
      chart: "daily",
      key: "marketing_visits",
      title: "Прогноз визитов",
      subtitle: "21 день · сессии сайта",
      labels: marketing.forecast.labels,
      values: marketing.forecast.visits,
      label: "Визиты",
      color: "#17181C",
    },
    {
      chart: "daily",
      key: "marketing_payments",
      title: "Прогноз оплат",
      subtitle: "21 день · оплаченные заказы",
      labels: marketing.forecast.labels,
      values: marketing.forecast.payments,
      label: "Оплаты",
      color: "#FFC400",
    },
    {
      chart: "daily",
      key: "marketing_revenue",
      title: "Прогноз выручки",
      subtitle: "21 день · выручка",
      labels: marketing.forecast.labels,
      values: marketing.forecast.revenue,
      label: "Выручка",
      valueKind: "money",
      color: "#1E8E3E",
    },
  ];

  return {
    meta: marketing.meta,
    roleNote:
      "Обзор маркетинга: прогноз визитов, оплат и выручки, проблемы канбана и риски воронки.",
    kpis: marketing.kpis,
    stages: [],
    showAmounts: false,
    forecastRisks,
    forecastCharts,
    problems,
    problemsTotal: total,
    problemsHref: "/issues",
    showForecastLink: false,
  };
}

export function getDashboardView(account: DemoAccount, now: Date = new Date()): DashboardView {
  if (account.role === "marketing") {
    return getMarketingOverviewView(now);
  }
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
      area: risk.domain === "production" ? "production" : "service",
    }));

  const dailyLabels = forecast.daily.map((point) => formatDayMonth(point.date));
  const longTermLabels = forecast.longTerm.map((point) => monthKeyLabel(point.key));
  const ordersHistory = forecast.longTerm.map((point) =>
    point.isForecast ? null : point.orders,
  );
  const ordersForecast = forecast.longTerm.map((point) =>
    point.isForecast ? point.orders : null,
  );
  const revenueHistory = forecast.longTerm.map((point) =>
    point.isForecast ? null : point.revenue,
  );
  const revenueForecast = forecast.longTerm.map((point) =>
    point.isForecast ? point.revenue : null,
  );
  const lastHistory = forecast.longTerm.findIndex((point) => point.isForecast) - 1;
  if (lastHistory >= 0) {
    ordersForecast[lastHistory] = ordersHistory[lastHistory];
    revenueForecast[lastHistory] = revenueHistory[lastHistory];
  }

  const dailyRevenueChart: DashboardChartVM = {
    chart: "daily",
    key: "forecast_revenue",
    title: "Прогноз выручки",
    subtitle: "21 день · оплаченные заказы",
    labels: dailyLabels,
    values: forecast.daily.map((point) => point.revenue),
    label: "Выручка",
    valueKind: "money",
    color: "#FFC400",
  };
  const dailyOrdersChart: DashboardChartVM = {
    chart: "daily",
    key: "forecast_orders",
    title: "Прогноз заказов",
    subtitle: "21 день · заказы в день",
    labels: dailyLabels,
    values: forecast.daily.map((point) => point.orders),
    label: "Заказы",
    color: "#17181C",
  };
  const stageChart: DashboardChartVM = {
    chart: "stage",
    key: "forecast_capacity",
    title: "Спрос vs мощности",
    subtitle: "21 день · жёлтый — спрос, серый — мощности, красный — сборка",
    labels: dailyLabels,
    orders: forecast.daily.map((point) => point.orders),
    capacities: STAGE_CAPACITY,
  };
  const shipmentsChart: DashboardChartVM = {
    chart: "shipments",
    key: "forecast_shipments",
    title: "Прогноз отправлений",
    subtitle: "21 день · заказы с доставкой",
    labels: dailyLabels,
    values: forecast.daily.map((point) => point.shipments),
  };
  const longTermOrdersChart: DashboardChartVM = {
    chart: "longTerm",
    key: "forecast_long_orders",
    title: "Долгосрочный прогноз заказов",
    subtitle: "12 месяцев истории + 3 месяца прогноза · жёлтая линия — прогноз",
    labels: longTermLabels,
    history: ordersHistory,
    forecast: ordersForecast,
  };
  const longTermRevenueChart: DashboardChartVM = {
    chart: "longTerm",
    key: "forecast_long_revenue",
    title: "Долгосрочный прогноз выручки",
    subtitle: "12 месяцев истории + 3 месяца прогноза · жёлтая линия — прогноз",
    labels: longTermLabels,
    history: revenueHistory,
    forecast: revenueForecast,
    valueKind: "money",
  };

  let forecastCharts: DashboardChartVM[] = [];
  switch (account.role) {
    case "ceo":
      forecastCharts = [dailyRevenueChart, stageChart, longTermOrdersChart];
      break;
    case "sales":
      forecastCharts = [dailyRevenueChart, dailyOrdersChart, longTermRevenueChart];
      break;
    case "production":
      forecastCharts = [stageChart, dailyOrdersChart, longTermOrdersChart];
      break;
    case "logistics_service":
      forecastCharts = [shipmentsChart, stageChart, longTermOrdersChart];
      break;
    default:
      forecastCharts = [];
  }

  const { problems, total: problemsTotal } = buildDashboardProblems(account.role, now);

  return {
    meta: `Данные на ${formatDateTime(now)} · Europe/Moscow`,
    roleNote: ROLE_NOTES[account.role] ?? "Срез направления.",
    kpis: isCeo ? ceoKpis : kpis,
    stages,
    showAmounts,
    forecastRisks,
    forecastCharts,
    problems,
    problemsTotal,
    problemsHref: canAccess(account.role, "issues") ? "/issues" : null,
    showForecastLink: canAccess(account.role, "forecast"),
  };
}
