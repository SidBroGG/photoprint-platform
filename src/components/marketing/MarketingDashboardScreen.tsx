"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { KpiCard } from "@/components/common/KpiCard";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { DailyMarketingChart } from "@/components/marketing/DailyMarketingChart";
import { MarketingBottleneckCard } from "@/components/marketing/MarketingBottleneckCard";
import { MarketingChannelsTable } from "@/components/marketing/MarketingChannelsTable";
import { MarketingForecastCharts } from "@/components/marketing/MarketingForecastCharts";
import { MarketingFunnel } from "@/components/marketing/MarketingFunnel";
import { MarketingProblemsList } from "@/components/marketing/MarketingProblemsList";
import type { MarketingDashboardView } from "@/lib/view/marketing";

export function MarketingDashboardScreen({
  data,
}: {
  data: MarketingDashboardView;
}) {
  return (
    <>
      <PageHeader description={data.note} meta={data.meta} />
      <Stack spacing={3}>
        <Box className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4" sx={{ gap: 2 }}>
          {data.kpis.map((kpi) => (
            <KpiCard
              key={kpi.label}
              label={kpi.label}
              value={kpi.value}
              hint={kpi.hint}
              tone={kpi.tone}
            />
          ))}
        </Box>

        <SectionCard
          title="Прогноз на 21 день"
          subtitle="Визиты, оплаты и выручка: линейный тренд по 30 дням и сезонность дня недели."
        >
          <MarketingForecastCharts forecast={data.forecast} />
        </SectionCard>

        <Box
          className="grid grid-cols-1 lg:grid-cols-2"
          sx={{ gap: 3, alignItems: "start" }}
        >
          <SectionCard
            title="Воронка клиента"
            subtitle="Вход на сайт → выбор шаблона → изменение шаблона → оплата. 30 дней."
          >
            <MarketingFunnel stages={data.funnel} />
          </SectionCard>

          <Stack spacing={3}>
            <SectionCard
              title="Узкое место"
              subtitle="Этап с максимальной долей отвала и рекомендуемое действие."
            >
              <MarketingBottleneckCard bottleneck={data.bottleneck} />
            </SectionCard>

            <SectionCard title="Методика" subtitle="Как читать маркетинговый дашборд.">
              <Typography variant="body2" color="text.secondary">
                Визиты и оплаты рассчитаны за 30 дней. Количество оплат и выручка сверены
                с оплаченными заказами платформы. CAC — расход на каналы, делённый на
                новых клиентов. Повторные продажи — доля заказов клиентов с предыдущим
                заказом за 12 месяцев. Данные демонстрационные и детерминированные.
              </Typography>
            </SectionCard>
          </Stack>
        </Box>

        <SectionCard
          title="Динамика по дням"
          subtitle="Визиты сайта и оплаченные заказы за 30 дней."
        >
          <DailyMarketingChart
            labels={data.daily.labels}
            visits={data.daily.visits}
            payments={data.daily.payments}
          />
        </SectionCard>

        <SectionCard
          title="Каналы привлечения"
          subtitle="Расход, CAC, выручка и доля канала в общей выручке."
        >
          <MarketingChannelsTable rows={data.channels} />
        </SectionCard>

        <SectionCard
          title="Проблемы каналов"
          subtitle="Каналы с низкой конверсией и высоким CAC: что проверить в первую очередь."
        >
          <MarketingProblemsList problems={data.channelProblems} />
        </SectionCard>
      </Stack>
    </>
  );
}
