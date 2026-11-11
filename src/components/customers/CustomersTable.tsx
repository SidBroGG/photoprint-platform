"use client";

import { useMemo, useState } from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import { DataTable, type DataColumn, type DataRow } from "@/components/common/DataTable";
import type { Tone } from "@/lib/labels";
import type { AbcClass, XyzClass } from "@/lib/analytics/customers";
import type { CustomerRowVM } from "@/lib/view/customers";

const COLUMNS: DataColumn[] = [
  { key: "client", label: "Клиент", width: 220 },
  { key: "revenue", label: "Оборот, 12 мес.", align: "right", width: 140 },
  { key: "orders", label: "Заказы", align: "right", width: 90 },
  { key: "averageCheck", label: "Средний чек", align: "right", width: 120 },
  { key: "lastOrder", label: "Последний заказ", width: 140 },
  { key: "ltv", label: "LTV, факт", align: "right", width: 130 },
  { key: "repeat", label: "Повторные", align: "right", width: 105 },
  { key: "abc", label: "ABC", align: "center", width: 80 },
  { key: "xyz", label: "XYZ", align: "center", width: 80 },
];

const ABC_TONE: Record<AbcClass, Tone> = { A: "success", B: "info", C: "neutral" };
const XYZ_TONE: Record<XyzClass, Tone> = { X: "success", Y: "warning", Z: "error" };

function rowFor(row: CustomerRowVM): DataRow {
  return {
    id: row.id,
    cells: {
      client: { text: row.name, secondary: row.segment },
      revenue: { text: row.revenueLabel, strong: true },
      orders: String(row.orders),
      averageCheck: row.averageCheckLabel,
      lastOrder: row.lastOrderLabel,
      ltv: row.ltvLabel,
      repeat: String(row.repeatOrders),
      abc: { text: row.abc, chip: { label: row.abc, tone: ABC_TONE[row.abc] } },
      xyz: { text: row.xyz, chip: { label: row.xyz, tone: XYZ_TONE[row.xyz] } },
    },
  };
}

export function CustomersTable({ rows }: { rows: CustomerRowVM[] }) {
  const [abc, setAbc] = useState("all");
  const [xyz, setXyz] = useState("all");

  const filtered = useMemo(
    () =>
      rows.filter(
        (row) =>
          (abc === "all" || row.abc === abc) && (xyz === "all" || row.xyz === xyz),
      ),
    [rows, abc, xyz],
  );

  return (
    <Box>
      <Box
        className="grid grid-cols-1 sm:grid-cols-2"
        sx={{ gap: 1.5, mb: 1.5, maxWidth: 520 }}
      >
        <TextField
          select
          label="Класс ABC"
          value={abc}
          onChange={(event) => setAbc(event.target.value)}
        >
          <MenuItem value="all">Все классы</MenuItem>
          <MenuItem value="A">A</MenuItem>
          <MenuItem value="B">B</MenuItem>
          <MenuItem value="C">C</MenuItem>
        </TextField>
        <TextField
          select
          label="Класс XYZ"
          value={xyz}
          onChange={(event) => setXyz(event.target.value)}
        >
          <MenuItem value="all">Все классы</MenuItem>
          <MenuItem value="X">X</MenuItem>
          <MenuItem value="Y">Y</MenuItem>
          <MenuItem value="Z">Z</MenuItem>
        </TextField>
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
        Показано {filtered.length} из {rows.length}
      </Typography>
      <DataTable
        columns={COLUMNS}
        rows={filtered.map(rowFor)}
        maxHeight={640}
        emptyText="Клиентов с выбранными классами нет."
      />
    </Box>
  );
}
