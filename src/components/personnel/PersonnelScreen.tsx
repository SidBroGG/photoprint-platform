"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { KpiCard } from "@/components/common/KpiCard";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { WorkloadTable } from "@/components/personnel/WorkloadTable";
import { OverdueList } from "@/components/personnel/OverdueList";
import type { PersonnelScreenView } from "@/lib/view/personnel";

export function PersonnelScreen({ data }: { data: PersonnelScreenView }) {
  return (
    <>
      <PageHeader
        description={`Загрузка сотрудников, перегрузки и контроль сроков. Срез: ${data.scopeLabel}.`}
        meta={data.meta}
      />
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
          title="Загрузка сотрудников"
          subtitle="Активные назначенные задачи относительно дневной нормы. Перегрузка — выше 100%."
        >
          <WorkloadTable rows={data.rows} />
        </SectionCard>
        <SectionCard
          title="Контроль сроков"
          subtitle="Просроченные заказы, обращения и отправления по ответственным."
        >
          <OverdueList rows={data.overdue} />
        </SectionCard>
      </Stack>
    </>
  );
}
