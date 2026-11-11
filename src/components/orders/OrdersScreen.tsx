"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { OrderPipeline } from "@/components/dashboard/OrderPipeline";
import { OrdersTable } from "@/components/orders/OrdersTable";
import type { OrdersView } from "@/lib/view/orders";

export function OrdersScreen({ data }: { data: OrdersView }) {
  return (
    <>
      <PageHeader
        description="Сквозной поток заказов: оплата и синхронизация, производство, готовность, доставка и вручение."
        meta={data.meta}
      />
      <Stack spacing={3}>
        <SectionCard title="Пайплайн заказов" subtitle="Активные заказы и вручённые за 30 дней.">
          <OrderPipeline stages={data.pipeline} />
        </SectionCard>
        <SectionCard
          title="Заказы"
          subtitle={
            data.mode === "production" || data.mode === "logistics"
              ? "Финансовые поля скрыты для вашей роли."
              : "Фильтры по номеру, клиенту, трекингу, оплате, этапу и доставке."
          }
        >
          <Box>
            <OrdersTable data={data} />
          </Box>
        </SectionCard>
      </Stack>
    </>
  );
}
