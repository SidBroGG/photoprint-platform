"use client";

import NextLink from "next/link";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { KpiCard } from "@/components/common/KpiCard";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
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
            subtitle="Прогнозные риски на горизонте 1–2 недели по данным прогноза."
          >
            <ForecastRiskList risks={data.forecastRisks} />
          </SectionCard>
        </Box>

        <SectionCard
          title="Канбан проблем"
          subtitle="Задачи по направлениям: критичность, статус и ответственный."
          action={
            <Button component={NextLink} href="/issues" variant="contained" size="small">
              Открыть канбан
            </Button>
          }
        >
          <Typography variant="body2" color="text.secondary">
            Закрепите задачу за собой, задайте краткое описание и критичность, переведите её в
            работу или на проверку. Генеральный директор видит все процессы по категориям,
            руководители и специалисты — только свои.
          </Typography>
        </SectionCard>
      </Stack>
    </>
  );
}
