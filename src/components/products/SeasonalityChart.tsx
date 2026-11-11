"use client";

import { BarChart } from "@mui/x-charts/BarChart";

export function SeasonalityChart({
  labels,
  orders,
}: {
  labels: string[];
  orders: number[];
}) {
  return (
    <BarChart
      height={300}
      series={[{ data: orders, label: "Заказы", color: "#17181C" }]}
      xAxis={[
        {
          scaleType: "band",
          data: labels,
          tickLabelStyle: { fontSize: 11 },
        },
      ]}
      grid={{ horizontal: true }}
      margin={{ left: 44, right: 16, top: 24, bottom: 48 }}
      hideLegend
    />
  );
}
