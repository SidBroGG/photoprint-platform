"use client";

import { DataTable, type DataColumn, type DataRow } from "@/components/common/DataTable";
import type { PersonnelOverdueVM } from "@/lib/view/personnel";

const COLUMNS: DataColumn[] = [
  { key: "employee", label: "Ответственный", width: 200 },
  { key: "object", label: "Объект", width: 280 },
  { key: "kind", label: "Тип", width: 130 },
];

export function OverdueList({ rows }: { rows: PersonnelOverdueVM[] }) {
  const data: DataRow[] = rows.map((row) => ({
    id: row.id,
    cells: {
      employee: row.employeeName,
      object: { text: row.label, href: row.href },
      kind: row.kindLabel,
    },
  }));
  return (
    <DataTable
      columns={COLUMNS}
      rows={data}
      maxHeight={420}
      emptyText="Просроченных задач нет."
    />
  );
}
