"use client";

import { LineChart } from "@mui/x-charts/LineChart";
import { BarChart } from "@mui/x-charts/BarChart";

function axisFormatter(kind: "count" | "money") {
  if (kind === "money") {
    return (value: number) => {
      if (Math.abs(value) >= 1_000_000) {
        return `${(value / 1_000_000).toFixed(1).replace(".", ",")} млн Br`;
      }
      if (Math.abs(value) >= 1000) {
        return `${Math.round(value / 1000)} тыс. Br`;
      }
      return String(value);
    };
  }
  return (value: number) => String(value);
}

export function DailyForecastChart({
  labels,
  values,
  label,
  kind = "count",
  color = "#17181C",
  height = 320,
  hideLegend = true,
  fill = false,
}: {
  labels: string[];
  values: number[];
  label: string;
  kind?: "count" | "money";
  color?: string;
  height?: number;
  hideLegend?: boolean;
  fill?: boolean;
}) {
  return (
    <LineChart
      height={fill ? undefined : height}
      sx={fill ? { width: "100%", height: "100%", flex: 1 } : { width: "100%" }}
      series={[{ data: values, label, color, showMark: false, curve: "linear" }]}
      xAxis={[{ scaleType: "point", data: labels, tickLabelStyle: { fontSize: 10 } }]}
      yAxis={[{ valueFormatter: axisFormatter(kind) }]}
      grid={{ horizontal: true }}
      margin={{ left: 66, right: 16, top: 24, bottom: 48 }}
      hideLegend={hideLegend}
    />
  );
}

export function StageDemandChart({
  labels,
  orders,
  capacities,
  height = 340,
  hideLegend = false,
  fill = false,
}: {
  labels: string[];
  orders: number[];
  capacities: { prepress: number; print: number; binding: number };
  height?: number;
  hideLegend?: boolean;
  fill?: boolean;
}) {
  return (
    <LineChart
      height={fill ? undefined : height}
      sx={fill ? { width: "100%", height: "100%", flex: 1 } : { width: "100%" }}
      series={[
        {
          data: orders,
          label: "Прогноз спроса",
          color: "#FFC400",
          showMark: false,
          curve: "linear",
        },
        {
          data: orders.map(() => capacities.prepress),
          label: `Допечатная · ${capacities.prepress}`,
          color: "#A9AFB8",
          showMark: false,
        },
        {
          data: orders.map(() => capacities.print),
          label: `Печать · ${capacities.print}`,
          color: "#6F7680",
          showMark: false,
        },
        {
          data: orders.map(() => capacities.binding),
          label: `Сборка · ${capacities.binding}`,
          color: "#C62828",
          showMark: false,
        },
      ]}
      xAxis={[{ scaleType: "point", data: labels, tickLabelStyle: { fontSize: 10 } }]}
      grid={{ horizontal: true }}
      margin={{ left: 44, right: 16, top: 24, bottom: 64 }}
      hideLegend={hideLegend}
    />
  );
}

export function ShipmentsChart({
  labels,
  values,
  height = 320,
  fill = false,
}: {
  labels: string[];
  values: number[];
  height?: number;
  fill?: boolean;
}) {
  return (
    <BarChart
      height={fill ? undefined : height}
      sx={fill ? { width: "100%", height: "100%", flex: 1 } : { width: "100%" }}
      series={[{ data: values, label: "Отправления", color: "#FFC400" }]}
      xAxis={[{ scaleType: "band", data: labels, tickLabelStyle: { fontSize: 10 } }]}
      grid={{ horizontal: true }}
      margin={{ left: 44, right: 16, top: 24, bottom: 48 }}
      hideLegend
    />
  );
}

export function LongTermChart({
  labels,
  history,
  forecast,
  kind = "count",
  height = 320,
  hideLegend = false,
  fill = false,
}: {
  labels: string[];
  history: (number | null)[];
  forecast: (number | null)[];
  kind?: "count" | "money";
  height?: number;
  hideLegend?: boolean;
  fill?: boolean;
}) {
  return (
    <LineChart
      height={fill ? undefined : height}
      sx={fill ? { width: "100%", height: "100%", flex: 1 } : { width: "100%" }}
      series={[
        { data: history, label: "История", color: "#17181C", showMark: false, curve: "linear" },
        { data: forecast, label: "Прогноз", color: "#FFC400", showMark: false, curve: "linear" },
      ]}
      xAxis={[{ scaleType: "point", data: labels, tickLabelStyle: { fontSize: 10 } }]}
      yAxis={[{ valueFormatter: axisFormatter(kind) }]}
      grid={{ horizontal: true }}
      margin={{ left: 66, right: 16, top: 24, bottom: 52 }}
      hideLegend={hideLegend}
    />
  );
}
