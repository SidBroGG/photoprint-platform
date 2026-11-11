"use client";

import { useMemo, useState } from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { DataTable, type DataColumn, type DataRow } from "@/components/common/DataTable";
import type { LogisticsRowVM, LogisticsView } from "@/lib/view/logistics";

const COLUMNS: DataColumn[] = [
  { key: "order", label: "Заказ", width: 130 },
  { key: "client", label: "Клиент", width: 190 },
  { key: "carrier", label: "Перевозчик", width: 130 },
  { key: "tracking", label: "Трекинг", width: 150 },
  { key: "shipped", label: "Отправлен", width: 150 },
  { key: "eta", label: "ETA", width: 110 },
  { key: "status", label: "Статус", width: 120 },
  { key: "reason", label: "Причина задержки", width: 260, wrap: true },
  { key: "coordinator", label: "Ответственный", width: 170 },
];

function rowFor(row: LogisticsRowVM): DataRow {
  return {
    id: row.id,
    cells: {
      order: { text: row.number, href: `/orders/${row.orderId}`, strong: true },
      client: row.clientName,
      carrier: row.carrier,
      tracking: { text: row.tracking, mono: true },
      shipped: row.shippedLabel,
      eta: {
        text: row.etaLabel,
        tone: row.overdue ? "error" : undefined,
        secondary: row.overdue ? "Просрочено" : undefined,
      },
      status: { text: row.statusLabel, chip: { label: row.statusLabel, tone: row.statusTone } },
      reason: row.delayReason,
      coordinator: row.coordinatorName,
    },
  };
}

export function ShipmentsTable({ data }: { data: LogisticsView }) {
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return data.rows;
    return data.rows.filter((row) =>
      `${row.tracking} ${row.number} ${row.clientName}`.toLowerCase().includes(query),
    );
  }, [data.rows, search]);

  return (
    <Box>
      <TextField
        label="Поиск по номеру отправления"
        placeholder="Трекинг, номер заказа или клиент"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        fullWidth
        sx={{ mb: 1, maxWidth: 480 }}
      />
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
        Показано {filtered.length} из {data.rows.length}
      </Typography>
      <DataTable
        columns={COLUMNS}
        rows={filtered.map(rowFor)}
        maxHeight={640}
        emptyText="Отправлений по запросу не найдено."
      />
    </Box>
  );
}
