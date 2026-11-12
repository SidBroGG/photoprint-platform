"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { KpiCard } from "@/components/common/KpiCard";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { TicketsTable } from "@/components/service/TicketsTable";
import type { ServiceScreenView } from "@/lib/view/service";

export function ServiceScreen({ data }: { data: ServiceScreenView }) {
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
          title="Обращения"
          subtitle="Просроченные SLA выделены. Первый ответ фиксируется по регламенту."
        >
          <TicketsTable rows={data.rows} />
        </SectionCard>
      </Stack>
    </>
  );
}
