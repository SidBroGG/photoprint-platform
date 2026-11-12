"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { KpiCard } from "@/components/common/KpiCard";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { EmptyState } from "@/components/common/EmptyState";
import { DataTable, type DataColumn, type DataRow } from "@/components/common/DataTable";
import { ForecastRiskList } from "@/components/dashboard/ForecastRiskList";
import {
  DailyForecastChart,
  LongTermChart,
  ShipmentsChart,
  StageDemandChart,
} from "@/components/forecast/ForecastCharts";
import type { ForecastScreenView } from "@/lib/view/forecast";

const STAGE_COLUMNS: DataColumn[] = [
  { key: "stage", label: "Этап", width: 200 },
  { key: "demand", label: "Спрос / день", align: "right", width: 120 },
  { key: "capacity", label: "Мощность", align: "right", width: 110 },
  { key: "overload", label: "Дней перегрузки, 14", align: "center", width: 160 },
  { key: "weeks", label: "Недели перегрузки", width: 320, wrap: true },
];

export function ForecastScreen({ data }: { data: ForecastScreenView }) {
  const stageRows: DataRow[] = data.stageRisks.map((stage) => ({
    id: stage.stage,
    cells: {
      stage: stage.label,
      demand: stage.averageDemandLabel,
      capacity: String(stage.capacity),
      overload: {
        text: String(stage.overloadDays14),
        tone: stage.overloadDays14 > 0 ? "error" : "success",
      },
      weeks: stage.weeksLabel,
    },
  }));

  return (
    <>
      <PageHeader description={data.methodNote} meta={data.meta} />
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

        {data.showSales && (
          <Box className="grid grid-cols-1 xl:grid-cols-2" sx={{ gap: 3 }}>
            <SectionCard
              title="Заказы, 21 день"
              subtitle="Ожидаемое количество заказов по дням."
            >
              <DailyForecastChart
                labels={data.daily.labels}
                values={data.daily.orders}
                label="Заказы"
                height={340}
              />
            </SectionCard>
            <SectionCard
              title="Выручка, 21 день"
              subtitle="Ожидаемая оплаченная выручка по дням."
            >
              <DailyForecastChart
                labels={data.daily.labels}
                values={data.daily.revenue}
                label="Выручка"
                kind="money"
                color="#E6B000"
                height={340}
              />
            </SectionCard>
          </Box>
        )}

        {data.showProduction && (
          <>
            <SectionCard
              title="Спрос и мощности по этапам"
              subtitle="Прогноз заказов в день против сменной мощности допечатной подготовки, печати и сборки."
            >
              <StageDemandChart
                labels={data.daily.labels}
                orders={data.daily.orders}
                capacities={data.capacities}
                height={360}
              />
            </SectionCard>
            <SectionCard
              title="Перегрузка этапов"
              subtitle="Дни перегрузки в ближайшие 14 дней и недели, где спрос превышает мощность."
            >
              <DataTable columns={STAGE_COLUMNS} rows={stageRows} dense />
            </SectionCard>
          </>
        )}

        {data.showLogistics && (
          <SectionCard
            title="Объём отправлений, 21 день"
            subtitle="Прогноз заказов с доставкой по дням."
          >
            <ShipmentsChart
              labels={data.daily.labels}
              values={data.daily.shipments}
              height={340}
            />
          </SectionCard>
        )}

        <SectionCard
          title="Риски на 1–3 недели"
          subtitle="Перегрузка производства и риск эскалации SLA с рекомендуемыми действиями."
        >
          {data.risks.length > 0 ? (
            <ForecastRiskList
              risks={data.risks.map((risk) => ({
                id: risk.id,
                title: risk.title,
                reason: risk.reason,
                action: risk.action,
                horizon: risk.horizon,
                severity: risk.severity,
                area: risk.area,
              }))}
              showLink={false}
            />
          ) : (
            <EmptyState text="Рисков на горизонте 1–3 недель не обнаружено." />
          )}
        </SectionCard>

        <SectionCard
          title="Долгосрочный тренд"
          subtitle="12 месяцев истории и 3 месяца прогноза. Жёлтая линия — прогноз."
        >
          <Box
            className={
              data.showSales
                ? "grid grid-cols-1 xl:grid-cols-2"
                : "grid grid-cols-1"
            }
            sx={{ gap: 3 }}
          >
            <Box>
              <DailyForecastTitle text="Заказы по месяцам" />
              <LongTermChart
                labels={data.longTerm.labels}
                history={data.longTerm.ordersHistory}
                forecast={data.longTerm.ordersForecast}
                height={340}
                hideLegend
              />
            </Box>
            {data.showSales && (
              <Box>
                <DailyForecastTitle text="Выручка по месяцам" />
                <LongTermChart
                  labels={data.longTerm.labels}
                  history={data.longTerm.revenueHistory}
                  forecast={data.longTerm.revenueForecast}
                  kind="money"
                  height={340}
                  hideLegend
                />
              </Box>
            )}
          </Box>
        </SectionCard>
      </Stack>
    </>
  );
}

function DailyForecastTitle({ text }: { text: string }) {
  return (
    <Box component="p" sx={{ m: 0, mb: 0.5, fontSize: 12.5, fontWeight: 600, color: "#5F6570" }}>
      {text}
    </Box>
  );
}
