"use client";

import NextLink from "next/link";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { ForecastRiskList } from "@/components/dashboard/ForecastRiskList";
import { DashboardForecastCharts } from "@/components/dashboard/DashboardForecastCharts";
import { DashboardProblems } from "@/components/dashboard/DashboardProblems";
import type { DashboardView } from "@/lib/view/dashboard";

export function DashboardScreen({ data }: { data: DashboardView }) {
  return (
    <>
      <PageHeader description={data.roleNote} meta={data.meta} />
      <Stack spacing={3}>
        <DashboardForecastCharts charts={data.forecastCharts} />

        <SectionCard
          title="Текущие проблемы"
          subtitle="Открытые задачи канбана, требующие решения. Сначала критичные."
          action={
            data.problemsHref ? (
              <Button
                component={NextLink}
                href={data.problemsHref}
                variant="contained"
                size="small"
              >
                Открыть канбан
              </Button>
            ) : undefined
          }
        >
          <DashboardProblems problems={data.problems} total={data.problemsTotal} />
        </SectionCard>

        <SectionCard
          title="Риск прогноза"
          subtitle="Прогнозные риски на горизонте 1–2 недели по данным прогноза."
        >
          <ForecastRiskList
            risks={data.forecastRisks}
            showLink={data.showForecastLink}
          />
        </SectionCard>
      </Stack>
    </>
  );
}
