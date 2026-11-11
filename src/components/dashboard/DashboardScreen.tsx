"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { KpiCard } from "@/components/common/KpiCard";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { AlertList } from "@/components/dashboard/AlertList";
import { OrderPipeline } from "@/components/dashboard/OrderPipeline";
import { ForecastRiskList } from "@/components/dashboard/ForecastRiskList";
import type { DashboardView } from "@/lib/view/dashboard";

export function DashboardScreen({ data }: { data: DashboardView }) {
  return (
    <>
      <PageHeader description={data.roleNote} meta={data.meta} />
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

        <Box
          className="grid grid-cols-1 lg:grid-cols-2"
          sx={{ gap: 3, alignItems: "start" }}
        >
          <SectionCard
            title="Сквозной поток"
            subtitle="Заказы на этапах процесса. Вручённые — за последние 30 дней."
          >
            <OrderPipeline stages={data.stages} />
          </SectionCard>
          <SectionCard
            title="Риск прогноза"
            subtitle="Сигналы на горизонте 1–2 недели по данным прогноза."
          >
            <ForecastRiskList risks={data.forecastRisks} />
          </SectionCard>
        </Box>

        <SectionCard
          title="Сигналы"
          subtitle="Что произошло, где отклонение, причина и рекомендуемое действие. Отметка «В работе» хранится локально в браузере."
        >
          <AlertList alerts={data.alerts} />
        </SectionCard>
      </Stack>
    </>
  );
}
