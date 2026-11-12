"use client";

import { LineChart } from "@mui/x-charts/LineChart";

export function DailyMarketingChart({
  labels,
  visits,
  payments,
}: {
  labels: string[];
  visits: number[];
  payments: number[];
}) {
  return (
    <LineChart
      height={300}
      series={[
        {
          data: visits,
          label: "Визиты",
          color: "#17181C",
          showMark: false,
          curve: "linear",
        },
        {
          data: payments,
          label: "Оплаты",
          color: "#FFC400",
          showMark: false,
          curve: "linear",
        },
      ]}
      xAxis={[{ scaleType: "point", data: labels, tickLabelStyle: { fontSize: 10 } }]}
      grid={{ horizontal: true }}
      margin={{ left: 48, right: 16, top: 24, bottom: 48 }}
    />
  );
}
