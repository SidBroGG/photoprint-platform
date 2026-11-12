"use client";

import { DataTable, type DataColumn, type DataRow } from "@/components/common/DataTable";
import type { ServiceRowVM } from "@/lib/view/service";

const COLUMNS: DataColumn[] = [
  { key: "topic", label: "Тема", width: 220 },
  { key: "client", label: "Клиент / заказ", width: 240 },
  { key: "opened", label: "Открыто", width: 150 },
  { key: "sla", label: "SLA", width: 150 },
  { key: "response", label: "Первый ответ", width: 150 },
  { key: "status", label: "Статус", width: 110 },
  { key: "assignee", label: "Исполнитель", width: 170 },
];

export function TicketsTable({ rows }: { rows: ServiceRowVM[] }) {
  const data: DataRow[] = rows.map((row) => ({
    id: row.id,
    cells: {
      topic: { text: row.topic, secondary: row.id },
      client: {
        text: row.clientName,
        href: `/orders/${row.orderId}`,
        secondary: row.orderId,
      },
      opened: row.openedLabel,
      sla: {
        text: row.slaLabel,
        tone: row.overdue ? "error" : undefined,
        secondary: row.overdue ? "Просрочено" : undefined,
      },
      response: {
        text: row.firstResponseLabel,
        tone:
          row.firstResponseLabel === "Нет ответа" && row.overdue
            ? "error"
            : undefined,
      },
      status: { text: row.statusLabel, chip: { label: row.statusLabel, tone: row.statusTone } },
      assignee: row.assigneeName,
    },
  }));

  return (
    <DataTable
      columns={COLUMNS}
      rows={data}
      maxHeight={640}
      emptyText="Обращений нет."
    />
  );
}
