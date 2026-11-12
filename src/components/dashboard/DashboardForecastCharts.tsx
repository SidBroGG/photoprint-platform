"use client";

import Box from "@mui/material/Box";
import { SectionCard } from "@/components/common/SectionCard";
import {
  DailyForecastChart,
  LongTermChart,
  ShipmentsChart,
  StageDemandChart,
} from "@/components/forecast/ForecastCharts";
import type { DashboardChartVM } from "@/lib/view/dashboard";

export function DashboardForecastCharts({
  charts,
}: {
  charts: DashboardChartVM[];
}) {
  if (charts.length === 0) return null;

  return (
    <Box className="grid grid-cols-1 lg:grid-cols-3" sx={{ gap: 3 }}>
      {charts.map((chart) => (
        <SectionCard key={chart.key} title={chart.title} subtitle={chart.subtitle}>
          {chart.chart === "daily" && (
            <DailyForecastChart
              labels={chart.labels}
              values={chart.values}
              label={chart.label}
              kind={chart.valueKind}
              color={chart.color}
            />
          )}
          {chart.chart === "stage" && (
            <StageDemandChart
              labels={chart.labels}
              orders={chart.orders}
              capacities={chart.capacities}
            />
          )}
          {chart.chart === "shipments" && (
            <ShipmentsChart labels={chart.labels} values={chart.values} />
          )}
          {chart.chart === "longTerm" && (
            <LongTermChart
              labels={chart.labels}
              history={chart.history}
              forecast={chart.forecast}
              kind={chart.valueKind}
            />
          )}
        </SectionCard>
      ))}
    </Box>
  );
}
