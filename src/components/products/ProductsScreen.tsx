"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { KpiCard } from "@/components/common/KpiCard";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { SeasonalityChart } from "@/components/products/SeasonalityChart";
import { DiscontinuedList, ProductsTable } from "@/components/products/ProductsTable";
import type { ProductsView } from "@/lib/view/products";

export function ProductsScreen({ data }: { data: ProductsView }) {
  return (
    <>
      <PageHeader
        description="Продуктовая аналитика: выручка, маржинальность, сезонность, повторные заказы и выбывшие позиции."
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
          title="Сезонность"
          subtitle={`Заказы по месяцам за 12 месяцев. Пиковый месяц: ${data.chart.peakLabel}. Текущий месяц показан частично.`}
        >
          <SeasonalityChart
            labels={data.chart.labels}
            orders={data.chart.orders}
            height={340}
          />
        </SectionCard>
        <SectionCard
          title="Продукты"
          subtitle="Заказы и выручка за 12 месяцев; маржа по каталогу; повторные заказы от возвращающихся клиентов."
        >
          <ProductsTable rows={data.rows} />
        </SectionCard>
        <SectionCard
          title="Выбывшие позиции"
          subtitle="Нет заказов более 60 дней. Проверьте цену, спрос или необходимость замены."
        >
          <DiscontinuedList rows={data.discontinued} />
        </SectionCard>
      </Stack>
    </>
  );
}
