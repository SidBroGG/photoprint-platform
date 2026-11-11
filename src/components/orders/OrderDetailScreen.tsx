"use client";

import NextLink from "next/link";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import { StatusChip } from "@/components/common/StatusChip";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { EmptyState } from "@/components/common/EmptyState";
import { OrderTimeline } from "@/components/orders/OrderTimeline";
import type { OrderDetailVM } from "@/lib/view/orders";

export function OrderDetailScreen({ data }: { data: OrderDetailVM }) {
  return (
    <>
      <Box sx={{ mb: 2 }}>
        <NextLink
          href="/orders"
          style={{ color: "#1565C0", fontSize: 13, textDecoration: "none", fontWeight: 500 }}
        >
          ← К заказам
        </NextLink>
      </Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          flexWrap: "wrap",
          mb: 1,
        }}
      >
        <Typography variant="h4" component="h1" sx={{ fontSize: 24 }}>
          Заказ {data.number}
        </Typography>
        <StatusChip label={data.stageLabel} tone={data.stageTone} />
        <StatusChip label={data.paymentLabel} tone={data.paymentTone} />
        {data.overdue && <StatusChip label="Просрочен" tone="error" />}
        {data.syncError && <StatusChip label="Ошибка синхронизации оплаты" tone="error" />}
      </Box>
      <PageHeader
        description={`Создан ${data.createdAtLabel} · ${data.clientName} · ${data.productName}`}
        meta={`Срок производства: ${data.dueLabel}`}
      />

      {data.syncError && (
        <Alert severity="error" sx={{ mb: 2.5 }}>
          Оплата получена, но статус не передан в ERP/1С. Повторите синхронизацию и проверьте
          пречек.
        </Alert>
      )}

      <Box
        className="grid grid-cols-1 lg:grid-cols-3"
        sx={{ gap: 3, alignItems: "start" }}
      >
        <Stack spacing={3} sx={{ gridColumn: { lg: "span 2" } }}>
          <SectionCard title="Сквозной процесс" subtitle="Отметки времени по текущему состоянию заказа.">
            <OrderTimeline steps={data.timeline} />
          </SectionCard>

          <SectionCard title="Заказ">
            <Box className="grid grid-cols-1 sm:grid-cols-2" sx={{ gap: 2 }}>
              <Field label="Клиент" value={`${data.clientName} · ${data.clientSegment}`} />
              <Field label="Продукт" value={data.productName} />
              <Field label="Количество" value={`${data.quantity} шт.`} />
              <Field label="Способ получения" value={data.deliveryMethodLabel} />
              <Field label="Текущий этап" value={data.stageLabel} />
              <Field label="Ответственный на производстве" value={data.assigneeName} />
              <Field label="Менеджер заказа" value={data.managerName} />
              <Field label="Завершение производства" value={data.productionCompletedLabel ?? "—"} />
            </Box>
          </SectionCard>

          <SectionCard title="Обращения" subtitle="Связанные обращения клиентского сервиса.">
            {data.tickets.length === 0 ? (
              <EmptyState text="Обращений по заказу нет." />
            ) : (
              <Stack spacing={1.25}>
                {data.tickets.map((ticket) => (
                  <Card key={ticket.id} variant="outlined" sx={{ borderColor: "#E3E6EB" }}>
                    <Box sx={{ p: 1.75 }}>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          gap: 1.5,
                          flexWrap: "wrap",
                        }}
                      >
                        <Box>
                          <Typography sx={{ fontSize: 13.5, fontWeight: 600 }}>
                            {ticket.topic}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {ticket.id} · открыто {ticket.openedLabel}
                          </Typography>
                        </Box>
                        <Stack direction="row" spacing={0.75}>
                          <StatusChip label={ticket.statusLabel} tone={ticket.statusTone} />
                          {ticket.overdue && <StatusChip label="SLA просрочен" tone="error" />}
                        </Stack>
                      </Box>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 2,
                          mt: 1,
                          flexWrap: "wrap",
                        }}
                      >
                        <Typography variant="caption" color="text.secondary">
                          SLA: {ticket.slaLabel} · исполнитель: {ticket.assigneeName}
                        </Typography>
                        {ticket.href && (
                          <NextLink
                            href={ticket.href}
                            style={{ color: "#1565C0", fontSize: 12.5, textDecoration: "none" }}
                          >
                            Перейти в сервис →
                          </NextLink>
                        )}
                      </Box>
                    </Box>
                  </Card>
                ))}
              </Stack>
            )}
          </SectionCard>
        </Stack>

        <Stack spacing={3}>
          {data.canSeeMoney && (
            <SectionCard title="Финансы">
              <Stack spacing={1.5}>
                <Field label="Сумма заказа" value={data.amountLabel ?? "—"} strong />
                <Field label="Себестоимость" value={data.costLabel ?? "—"} />
                <Field label="Маржа" value={data.marginLabel ?? "—"} />
                <Field label="Маржинальность" value={data.marginPctLabel ?? "—"} />
                <Field label="Оплата" value={data.paymentLabel} />
                <Field label="Оплачен" value={data.paidAtLabel ?? "—"} />
              </Stack>
            </SectionCard>
          )}

          <SectionCard title="Доставка">
            {data.shipment ? (
              <Stack spacing={1.5}>
                <Field label="Перевозчик" value={data.shipment.carrier} />
                <Field label="Трекинг" value={data.shipment.tracking} />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Статус
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <StatusChip
                      label={data.shipment.statusLabel}
                      tone={data.shipment.statusTone}
                    />
                  </Box>
                </Box>
                <Field label="Отправлен" value={data.shipment.shippedAtLabel} />
                <Field label="ETA" value={data.shipment.etaLabel} />
                <Field label="Вручён" value={data.shipment.deliveredAtLabel ?? "—"} />
                <Field label="Причина задержки" value={data.shipment.delayReason} />
                <Field label="Координатор" value={data.shipment.coordinatorName} />
              </Stack>
            ) : (
              <EmptyState
                text={
                  data.deliveryMethodLabel === "Самовывоз"
                    ? "Самовывоз: отправление не создаётся."
                    : "Заказ ещё не передан в доставку."
                }
              />
            )}
          </SectionCard>
        </Stack>
      </Box>
    </>
  );
}

function Field({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: strong ? 700 : 500, mt: 0.15 }}>
        {value}
      </Typography>
    </Box>
  );
}
