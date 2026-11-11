"use client";

import Box from "@mui/material/Box";
import { DataTable, type DataColumn, type DataRow } from "@/components/common/DataTable";
import type { DiscontinuedRowVM, ProductRowVM } from "@/lib/view/products";

const PRODUCT_COLUMNS: DataColumn[] = [
  { key: "product", label: "Продукт", width: 260 },
  { key: "orders", label: "Заказы", align: "right", width: 90 },
  { key: "revenue", label: "Выручка", align: "right", width: 130 },
  { key: "margin", label: "Маржа", align: "right", width: 90 },
  { key: "repeat", label: "Повторные", align: "right", width: 105 },
  { key: "peak", label: "Пиковый сезон", width: 120 },
  { key: "status", label: "Статус", width: 170 },
];

const DISCONTINUED_COLUMNS: DataColumn[] = [
  { key: "product", label: "Продукт", width: 280 },
  { key: "lastOrder", label: "Последний заказ", width: 150 },
  { key: "orders", label: "Заказов за 12 мес.", align: "right", width: 150 },
  { key: "margin", label: "Маржа", align: "right", width: 100 },
];

export function ProductsTable({ rows }: { rows: ProductRowVM[] }) {
  const data: DataRow[] = rows.map((row) => ({
    id: row.id,
    cells: {
      product: { text: row.name, secondary: row.categoryLabel },
      orders: String(row.orders),
      revenue: { text: row.revenueLabel, strong: true },
      margin: row.marginLabel,
      repeat: row.repeatShareLabel,
      peak: row.peakLabel,
      status: {
        text: row.statusLabel,
        chip: { label: row.statusLabel, tone: row.statusTone },
      },
    },
  }));
  return <DataTable columns={PRODUCT_COLUMNS} rows={data} maxHeight={640} />;
}

export function DiscontinuedList({ rows }: { rows: DiscontinuedRowVM[] }) {
  const data: DataRow[] = rows.map((row) => ({
    id: row.id,
    cells: {
      product: row.name,
      lastOrder: row.lastOrderLabel,
      orders: String(row.orders),
      margin: row.marginLabel,
    },
  }));
  return (
    <Box>
      <DataTable
        columns={DISCONTINUED_COLUMNS}
        rows={data}
        emptyText="Выбывших позиций нет."
      />
    </Box>
  );
}
