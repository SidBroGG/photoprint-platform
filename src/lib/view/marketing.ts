import { buildCustomerAnalytics } from "@/lib/analytics/customers";
import { buildMarketingForecast } from "@/lib/analytics/marketingForecast";
import { getMarketingDataset } from "@/lib/data/marketing";
import { getDataset } from "@/lib/data/store";
import {
  formatDateTime,
  formatDayMonth,
  formatMoney,
  formatMoneyCompact,
  formatNumber,
  formatPercent,
  plural,
} from "@/lib/format";
import type { Tone } from "@/lib/labels";
import type { KpiVM } from "@/lib/view/dashboard";
import type { MarketingFunnelStageKey } from "@/types/marketing";

export interface MarketingFunnelStageVM {
  key: MarketingFunnelStageKey;
  label: string;
  count: number;
  countLabel: string;
  conversionLabel: string;
  dropOffLabel: string;
  dropOffShare: number;
  isBottleneck: boolean;
  tone: Tone;
}

export interface MarketingBottleneckVM {
  stageLabel: string;
  dropOffLabel: string;
  lostLabel: string;
  recommendation: string;
}

export interface MarketingChannelVM {
  id: string;
  label: string;
  visitsLabel: string;
  paymentsLabel: string;
  conversionLabel: string;
  costLabel: string;
  cacLabel: string;
  revenueLabel: string;
  revenueShareLabel: string;
}

export interface MarketingProblemVM {
  id: string;
  title: string;
  detail: string;
  action: string;
  severity: "critical" | "warning";
  severityLabel: string;
}

export interface MarketingDashboardView {
  meta: string;
  note: string;
  kpis: KpiVM[];
  funnel: MarketingFunnelStageVM[];
  bottleneck: MarketingBottleneckVM | null;
  channels: MarketingChannelVM[];
  channelProblems: MarketingProblemVM[];
  forecast: {
    labels: string[];
    visits: number[];
    payments: number[];
    revenue: number[];
  };
  daily: {
    labels: string[];
    visits: number[];
    payments: number[];
  };
}

const STAGE_LABELS: Record<MarketingFunnelStageKey, string> = {
  visit: "Вход на сайт",
  template_selected: "Выбор шаблона",
  template_modified: "Изменение шаблона",
  payment: "Оплата",
};

const STAGE_RECOMMENDATIONS: Record<MarketingFunnelStageKey, string> = {
  visit: "Проверить источники трафика, скорость загрузки и первый экран сайта.",
  template_selected:
    "Упростить каталог: подборки по поводу, фильтры и быстрый просмотр шаблонов.",
  template_modified:
    "Упростить редактор: подсказки, автосохранение и предпросмотр результата.",
  payment:
    "Проверить способы оплаты, пречек и ошибки синхронизации с ERP/1С.",
};

export function getMarketingDashboardView(
  now: Date = new Date(),
): MarketingDashboardView {
  const data = getMarketingDataset(now);
  const customers = buildCustomerAnalytics(getDataset(now), now);
  const totals = data.totals;
  const conversion = totals.visits > 0 ? totals.payments / totals.visits : 0;
  const cac = totals.newCustomers > 0 ? totals.cost / totals.newCustomers : 0;
  const averageCheck = totals.payments > 0 ? totals.revenue / totals.payments : 0;

  const rawStages: { key: MarketingFunnelStageKey; count: number }[] = [
    { key: "visit", count: totals.visits },
    { key: "template_selected", count: totals.templateSelections },
    { key: "template_modified", count: totals.templateModifications },
    { key: "payment", count: totals.payments },
  ];

  const funnel: MarketingFunnelStageVM[] = rawStages.map((stage, index) => {
    const previous = index > 0 ? rawStages[index - 1] : null;
    const stageConversion =
      previous && previous.count > 0
        ? stage.count / previous.count
        : previous
          ? 0
          : 1;
    const dropOffShare = previous ? 1 - stageConversion : 0;
    return {
      key: stage.key,
      label: STAGE_LABELS[stage.key],
      count: stage.count,
      countLabel: formatNumber(stage.count),
      conversionLabel: previous ? formatPercent(stageConversion, 1) : "—",
      dropOffLabel: previous ? formatPercent(dropOffShare, 1) : "—",
      dropOffShare,
      isBottleneck: false,
      tone: index === 0 ? "info" : "neutral",
    };
  });

  const bottleneckStage = funnel
    .slice(1)
    .reduce((best, stage) =>
      stage.dropOffShare > best.dropOffShare ? stage : best,
    );
  const bottleneckIndex = funnel.findIndex(
    (stage) => stage.key === bottleneckStage.key,
  );
  const previousStage = bottleneckIndex > 0 ? rawStages[bottleneckIndex - 1] : null;

  funnel.forEach((stage) => {
    if (stage.key === bottleneckStage.key) {
      stage.isBottleneck = true;
      stage.tone = "warning";
    }
  });

  const bottleneck: MarketingBottleneckVM | null =
    previousStage && bottleneckStage.dropOffShare > 0
      ? {
          stageLabel: bottleneckStage.label,
          dropOffLabel: bottleneckStage.dropOffLabel,
          lostLabel: `${formatNumber(previousStage.count - bottleneckStage.count)} ${plural(
            previousStage.count - bottleneckStage.count,
            "клиент",
            "клиента",
            "клиентов",
          )}`,
          recommendation: STAGE_RECOMMENDATIONS[bottleneckStage.key],
        }
      : null;

  const channels: MarketingChannelVM[] = data.channels
    .slice()
    .sort((a, b) => b.revenue - a.revenue)
    .map((channel) => ({
      id: channel.id,
      label: channel.label,
      visitsLabel: formatNumber(channel.visits),
      paymentsLabel: formatNumber(channel.payments),
      conversionLabel: formatPercent(
        channel.visits > 0 ? channel.payments / channel.visits : 0,
        1,
      ),
      costLabel: formatMoney(channel.cost),
      cacLabel: formatMoney(
        channel.newCustomers > 0 ? channel.cost / channel.newCustomers : 0,
      ),
      revenueLabel: formatMoney(channel.revenue),
      revenueShareLabel: formatPercent(
        totals.revenue > 0 ? channel.revenue / totals.revenue : 0,
        1,
      ),
    }));

  const forecast = buildMarketingForecast(data, now);
  const channelProblems: MarketingProblemVM[] = [];
  const channelsWithTraffic = data.channels.filter((channel) => channel.visits > 0);
  if (channelsWithTraffic.length > 0) {
    const worstConversion = channelsWithTraffic
      .slice()
      .sort(
        (a, b) =>
          a.payments / a.visits - b.payments / b.visits,
      )[0]!;
    channelProblems.push({
      id: `conversion-${worstConversion.id}`,
      title: `Низкая конверсия: ${worstConversion.label}`,
      detail: `Конверсия ${formatPercent(
        worstConversion.payments / worstConversion.visits,
        1,
      )} против ${formatPercent(conversion, 1)} в среднем по сайту.`,
      action: "Проверить креативы, посадочные страницы и релевантность трафика.",
      severity: "warning",
      severityLabel: "Предупреждение",
    });
  }
  const channelsWithCustomers = data.channels.filter(
    (channel) => channel.newCustomers > 0,
  );
  if (channelsWithCustomers.length > 0) {
    const worstCac = channelsWithCustomers
      .slice()
      .sort(
        (a, b) =>
          b.cost / b.newCustomers - a.cost / a.newCustomers,
      )[0]!;
    channelProblems.push({
      id: `cac-${worstCac.id}`,
      title: `Высокий CAC: ${worstCac.label}`,
      detail: `CAC ${formatMoney(
        worstCac.cost / worstCac.newCustomers,
      )} при среднем ${formatMoney(cac)}.`,
      action: "Пересмотреть ставки, аудитории и семантику канала.",
      severity: "warning",
      severityLabel: "Предупреждение",
    });
  }

  return {
    meta: `30 дней · ${formatNumber(totals.visits)} визитов · ${formatDateTime(now)} · Беларусь, Великий Камень`,
    note:
      "Срез маркетинга: воронка сайта, каналы привлечения, конверсия и стоимость привлечения. Показаны только маркетинговые метрики.",
    kpis: [
      {
        label: "Визиты, 30 дней",
        value: formatNumber(totals.visits),
        hint: "Сессии сайта по всем каналам",
      },
      {
        label: "Конверсия в оплату",
        value: formatPercent(conversion, 1),
        hint: "От входа на сайт до оплаты",
        tone: "accent",
      },
      {
        label: "Оплаченные заказы",
        value: formatNumber(totals.payments),
        hint: "Сверено с оплатами в заказах",
      },
      {
        label: "CAC",
        value: formatMoney(cac),
        hint: "Расход на маркетинг / новые клиенты",
      },
      {
        label: "Выручка, 30 дней",
        value: formatMoneyCompact(totals.revenue),
        hint: `Средний чек ${formatMoney(averageCheck)}`,
      },
      {
        label: "Повторные продажи",
        value: formatPercent(customers.repeatSalesShare, 0),
        hint: "Доля заказов клиентов с предыдущим заказом, 12 мес.",
      },
    ],
    funnel,
    bottleneck,
    channels,
    channelProblems,
    forecast: {
      labels: forecast.map((point) => formatDayMonth(point.date)),
      visits: forecast.map((point) => point.visits),
      payments: forecast.map((point) => point.payments),
      revenue: forecast.map((point) => point.revenue),
    },
    daily: {
      labels: data.daily.map((point) => formatDayMonth(point.date)),
      visits: data.daily.map((point) => point.visits),
      payments: data.daily.map((point) => point.payments),
    },
  };
}
