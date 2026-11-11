import type { DemoAccount } from "@/lib/auth/roles";
import { getDataset } from "@/lib/data/store";
import { buildForecast } from "@/lib/analytics/forecast";
import { STAGE_CAPACITY } from "@/types/domain";
import { formatDate, formatDayMonth, formatMoneyCompact, formatNumber, formatPercent } from "@/lib/format";
import { monthKeyLabel } from "@/lib/dates";
import type { KpiVM } from "@/lib/view/dashboard";

export interface ForecastStageRiskVM {
  stage: string;
  label: string;
  capacity: number;
  averageDemandLabel: string;
  maxDemand: number;
  overloadDays14: number;
  weeksLabel: string;
}

export interface ForecastRiskVM {
  id: string;
  title: string;
  reason: string;
  action: string;
  horizon: string;
  severity: "critical" | "warning";
  severityLabel: string;
  domainLabel: string;
}

export interface ForecastScreenView {
  meta: string;
  methodNote: string;
  showSales: boolean;
  showProduction: boolean;
  showLogistics: boolean;
  kpis: KpiVM[];
  daily: {
    labels: string[];
    orders: number[];
    revenue: number[];
    shipments: number[];
  };
  capacities: { prepress: number; print: number; binding: number };
  stageRisks: ForecastStageRiskVM[];
  longTerm: {
    labels: string[];
    ordersHistory: (number | null)[];
    ordersForecast: (number | null)[];
    revenueHistory: (number | null)[];
    revenueForecast: (number | null)[];
  };
  risks: ForecastRiskVM[];
}

export function getForecastScreenView(
  account: DemoAccount,
  now: Date = new Date(),
): ForecastScreenView {
  const dataset = getDataset(now);
  const forecast = buildForecast(dataset, now);
  const role = account.role;
  const showSales = role === "ceo" || role === "sales";
  const showProduction = role === "ceo" || role === "production";
  const showLogistics = role === "ceo" || role === "logistics_service";

  const stageRisks: ForecastStageRiskVM[] = forecast.stageRisks.map((stage) => ({
    stage: stage.stage,
    label: stage.label,
    capacity: stage.capacity,
    averageDemandLabel: stage.averageDemand.toFixed(1).replace(".", ","),
    maxDemand: stage.maxDemand,
    overloadDays14: stage.overloadDays14,
    weeksLabel:
      stage.overloadWeeks.length > 0
        ? stage.overloadWeeks
            .map((week) => `${week.days} дн. с ${formatDate(week.weekStart)}`)
            .join("; ")
        : "—",
  }));

  const bottleneckByLoad = forecast.stageRisks
    .slice()
    .sort(
      (a, b) =>
        b.averageDemand / b.capacity - a.averageDemand / a.capacity,
    )[0];

  const totalOrders = forecast.daily.reduce((sum, point) => sum + point.orders, 0);
  const totalRevenue = forecast.daily.reduce((sum, point) => sum + point.revenue, 0);
  const totalShipments = forecast.daily.reduce((sum, point) => sum + point.shipments, 0);
  const averageDemand =
    forecast.daily.length > 0 ? totalOrders / forecast.daily.length : 0;
  const maxDemand = forecast.daily.reduce((max, point) => Math.max(max, point.orders), 0);

  const kpis: KpiVM[] = [];
  if (showSales) {
    kpis.push(
      {
        label: "Горизонт",
        value: "21 день",
        hint: "Краткосрочный прогноз",
      },
      {
        label: "Прогноз выручки",
        value: formatMoneyCompact(totalRevenue),
        hint: "Сумма за 21 день",
        tone: "accent",
      },
      {
        label: "Прогноз заказов",
        value: formatNumber(totalOrders),
        hint: `${averageDemand.toFixed(1).replace(".", ",")} заказов в день`,
      },
      {
        label: "Средний чек",
        value: totalOrders > 0 ? formatNumber(Math.round(totalRevenue / totalOrders)) + " ₽" : "—",
        hint: "Прогнозная выручка / заказы",
      },
    );
  }
  if (showProduction) {
    kpis.push(
      {
        label: "Средний спрос",
        value: `${averageDemand.toFixed(1).replace(".", ",")}`,
        hint: "Заказов в день, 21 день",
      },
      {
        label: "Узкое место",
        value: bottleneckByLoad?.label ?? "—",
        hint: bottleneckByLoad
          ? `Мощность ${bottleneckByLoad.capacity} заказов/день`
          : "Перегрузок нет",
        tone: "warning",
      },
      {
        label: "Дней перегрузки",
        value: bottleneckByLoad ? `${bottleneckByLoad.overloadDays14} из 14` : "0",
        hint: "Ближайшие 14 дней",
        tone:
          bottleneckByLoad && bottleneckByLoad.overloadDays14 > 0 ? "error" : "success",
      },
      {
        label: "Пик спроса",
        value: `${maxDemand}`,
        hint: "Заказов в самый загруженный день",
      },
    );
  }
  if (showLogistics) {
    kpis.push(
      {
        label: "Прогноз отправлений",
        value: formatNumber(totalShipments),
        hint: "За 21 день",
      },
      {
        label: "Доля доставки",
        value: formatPercent(forecast.deliveryShare, 0),
        hint: "Заказов с доставкой за 30 дней",
      },
      {
        label: "Риск SLA",
        value: String(forecast.risks.filter((risk) => risk.domain === "service").length),
        hint: "Риски прогноза по сервису",
        tone: forecast.risks.some((risk) => risk.domain === "service") ? "warning" : "success",
      },
      {
        label: "Горизонт",
        value: "21 день",
        hint: "Краткосрочный прогноз",
      },
    );
  }
  if (kpis.length > 4) {
    kpis.splice(4);
  }
  if (role === "ceo") {
    kpis.length = 0;
    kpis.push(
      {
        label: "Прогноз выручки",
        value: formatMoneyCompact(totalRevenue),
        hint: "Сумма за 21 день",
        tone: "accent",
      },
      {
        label: "Узкое место",
        value: bottleneckByLoad?.label ?? "—",
        hint: bottleneckByLoad
          ? `Спрос ${bottleneckByLoad.averageDemand.toFixed(1).replace(".", ",")} при мощности ${bottleneckByLoad.capacity}`
          : "Перегрузок нет",
        tone: "warning",
      },
      {
        label: "Дней перегрузки",
        value: bottleneckByLoad ? `${bottleneckByLoad.overloadDays14} из 14` : "0",
        hint: "Ближайшие 14 дней",
        tone:
          bottleneckByLoad && bottleneckByLoad.overloadDays14 > 0 ? "error" : "success",
      },
      {
        label: "Прогноз отправлений",
        value: formatNumber(totalShipments),
        hint: "За 21 день",
      },
    );
  }

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

  const risks: ForecastRiskVM[] = forecast.risks
    .filter((risk) =>
      risk.domain === "production" ? showProduction : showLogistics,
    )
    .map((risk) => ({
      id: risk.id,
      title: risk.title,
      reason: risk.reason,
      action: risk.action,
      horizon: risk.horizon,
      severity: risk.severity,
      severityLabel: risk.severity === "critical" ? "Критично" : "Предупреждение",
      domainLabel: risk.domain === "production" ? "Производство" : "Клиентский сервис",
    }));

  return {
    meta: `Горизонт 21 день и 3 месяца · ${formatDate(now)} · демо-прогноз на мок-данных`,
    methodNote:
      "Краткосрочный прогноз: линейный тренд МНК и сезонные коэффициенты дня недели по 56 дням истории. Долгосрочный: 12 месяцев истории, месячный тренд и сезонный индекс. Демо-прогноз не является гарантией точности.",
    showSales,
    showProduction,
    showLogistics,
    kpis,
    daily: {
      labels: forecast.daily.map((point) => formatDayMonth(point.date)),
      orders: forecast.daily.map((point) => point.orders),
      revenue: forecast.daily.map((point) => point.revenue),
      shipments: forecast.daily.map((point) => point.shipments),
    },
    capacities: {
      prepress: STAGE_CAPACITY.prepress,
      print: STAGE_CAPACITY.print,
      binding: STAGE_CAPACITY.binding,
    },
    stageRisks,
    longTerm: {
      labels: longTermLabels,
      ordersHistory,
      ordersForecast,
      revenueHistory,
      revenueForecast,
    },
    risks,
  };
}
