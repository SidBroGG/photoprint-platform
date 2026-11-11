"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { KpiCard } from "@/components/common/KpiCard";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { AbcXyzMatrix } from "@/components/customers/AbcXyzMatrix";
import { CustomersTable } from "@/components/customers/CustomersTable";
import type { CustomersView } from "@/lib/view/customers";

export function CustomersScreen({ data }: { data: CustomersView }) {
  return (
    <>
      <PageHeader
        description="Клиентская база: обороты, ABC/XYZ-анализ, фактический LTV и повторные продажи."
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
          title="Матрица ABC × XYZ"
          subtitle="Количество клиентов и доля выручки в каждой ячейке."
        >
          <AbcXyzMatrix cells={data.matrix} />
        </SectionCard>
        <SectionCard
          title="Клиенты"
          subtitle="Оборот за 12 месяцев, LTV, повторные заказы и классы ABC/XYZ."
        >
          <CustomersTable rows={data.rows} />
        </SectionCard>
      </Stack>
    </>
  );
}
