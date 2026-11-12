"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { KpiCard } from "@/components/common/KpiCard";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { OrderPipeline } from "@/components/dashboard/OrderPipeline";
import type { DashboardView } from "@/lib/view/dashboard";

export function MetricsScreen({ data }: { data: DashboardView }) {
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

        <SectionCard
          title="Сквозной поток"
          subtitle="Заказы на этапах процесса. Вручённые — за последние 30 дней."
        >
          <OrderPipeline stages={data.stages} />
        </SectionCard>
      </Stack>
    </>
  );
}
