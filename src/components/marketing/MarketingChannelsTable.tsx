"use client";

import { DataTable, type DataColumn, type DataRow } from "@/components/common/DataTable";
import type { MarketingChannelVM } from "@/lib/view/marketing";

const CHANNEL_COLUMNS: DataColumn[] = [
  { key: "channel", label: "Канал", width: 170 },
  { key: "visits", label: "Визиты", align: "right", width: 90 },
  { key: "payments", label: "Оплаты", align: "right", width: 90 },
  { key: "conversion", label: "Конверсия", align: "right", width: 105 },
  { key: "cost", label: "Расход", align: "right", width: 110 },
  { key: "cac", label: "CAC", align: "right", width: 100 },
  { key: "revenue", label: "Выручка", align: "right", width: 130 },
  { key: "share", label: "Доля выручки", align: "right", width: 120 },
];

export function MarketingChannelsTable({ rows }: { rows: MarketingChannelVM[] }) {
  const data: DataRow[] = rows.map((row) => ({
    id: row.id,
    cells: {
      channel: row.label,
      visits: row.visitsLabel,
      payments: row.paymentsLabel,
      conversion: row.conversionLabel,
      cost: row.costLabel,
      cac: row.cacLabel,
      revenue: { text: row.revenueLabel, strong: true },
      share: row.revenueShareLabel,
    },
  }));

  return <DataTable columns={CHANNEL_COLUMNS} rows={data} maxHeight={420} />;
}
