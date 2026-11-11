"use client";

import { DataTable, type DataColumn, type DataRow } from "@/components/common/DataTable";
import type { ProductionRiskVM } from "@/lib/view/production";

const COLUMNS: DataColumn[] = [
  { key: "order", label: "Заказ", width: 150 },
  { key: "product", label: "Продукт", width: 220 },
  { key: "stage", label: "Этап", width: 160 },
  { key: "assignee", label: "Ответственный", width: 170 },
  { key: "due", label: "Срок", width: 150 },
  { key: "reason", label: "Причина", width: 300, wrap: true },
];

export function RiskOrders({ rows }: { rows: ProductionRiskVM[] }) {
  const data: DataRow[] = rows.map((row) => ({
    id: row.id,
    cells: {
      order: { text: row.number, href: `/orders/${row.id}`, strong: true },
      product: row.productName,
      stage: row.stageLabel,
      assignee: row.assigneeName,
      due: {
        text: row.dueLabel,
        tone: row.overdue ? "error" : "warning",
        secondary: row.overdue ? "Просрочено" : undefined,
      },
      reason: row.reason,
    },
  }));
  return (
    <DataTable
      columns={COLUMNS}
      rows={data}
      maxHeight={520}
      emptyText="Просроченных и рискованных заказов нет."
    />
  );
}
