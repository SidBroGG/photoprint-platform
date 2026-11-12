"use client";

import { BarChart } from "@mui/x-charts/BarChart";

export function SeasonalityChart({
  labels,
  orders,
  height = 340,
}: {
  labels: string[];
  orders: number[];
  height?: number;
}) {
  return (
    <BarChart
      height={height}
      sx={{ width: "100%" }}
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
