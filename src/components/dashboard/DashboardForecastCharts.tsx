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
        <SectionCard
          key={chart.key}
          title={chart.title}
          subtitle={chart.subtitle}
          fill
        >
          <Box sx={{ flex: 1, minHeight: 340, minWidth: 0, display: "flex" }}>
            {chart.chart === "daily" && (
              <DailyForecastChart
                labels={chart.labels}
                values={chart.values}
                label={chart.label}
                kind={chart.valueKind}
                color={chart.color}
                fill
              />
            )}
            {chart.chart === "stage" && (
              <StageDemandChart
                labels={chart.labels}
                orders={chart.orders}
                capacities={chart.capacities}
                hideLegend
                fill
              />
            )}
            {chart.chart === "shipments" && (
              <ShipmentsChart labels={chart.labels} values={chart.values} fill />
            )}
            {chart.chart === "longTerm" && (
              <LongTermChart
                labels={chart.labels}
                history={chart.history}
                forecast={chart.forecast}
                kind={chart.valueKind}
                hideLegend
                fill
              />
            )}
          </Box>
        </SectionCard>
      ))}
    </Box>
  );
}
