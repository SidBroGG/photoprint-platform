"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { KpiCard } from "@/components/common/KpiCard";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { ShipmentsTable } from "@/components/logistics/ShipmentsTable";
import type { LogisticsView } from "@/lib/view/logistics";

export function LogisticsScreen({ data }: { data: LogisticsView }) {
  return (
    <>
      <PageHeader
        description="Доставка готовой продукции: поиск по номеру отправления, задержки, ETA и ответственные координаторы. Самовывоз помечен отдельно."
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
          title="Отправления"
          subtitle="Задержки и заказы без трекинга выделены. Самовывоз не имеет отправления."
        >
          <ShipmentsTable data={data} />
        </SectionCard>
      </Stack>
    </>
  );
}
