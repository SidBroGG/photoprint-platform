"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { KpiCard } from "@/components/common/KpiCard";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { StageLoad } from "@/components/production/StageLoad";
import { RiskOrders } from "@/components/production/RiskOrders";
import type { ProductionScreenView } from "@/lib/view/production";

export function ProductionScreen({ data }: { data: ProductionScreenView }) {
  return (
    <>
      <PageHeader
        description={data.note}
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
        {data.stages.length > 0 && (
          <SectionCard
            title="Загрузка этапов"
            subtitle="Активная очередь относительно сменной мощности. Красный — очередь достигла мощности."
          >
            <StageLoad stages={data.stages} />
          </SectionCard>
        )}
        <SectionCard
          title={data.mode === "specialist" ? "Мои рискованные заказы" : "Просроченные и рискованные заказы"}
          subtitle="Срок, этап, ответственный и причина отклонения."
        >
          <RiskOrders rows={data.risks} />
        </SectionCard>
      </Stack>
    </>
  );
}
