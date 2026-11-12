"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { DailyForecastChart } from "@/components/forecast/ForecastCharts";
import type { MarketingDashboardView } from "@/lib/view/marketing";

export function MarketingForecastCharts({
  forecast,
}: {
  forecast: MarketingDashboardView["forecast"];
}) {
  return (
    <Box className="grid grid-cols-1 lg:grid-cols-3" sx={{ gap: 3 }}>
      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1.25 }}>
          Визиты
        </Typography>
        <DailyForecastChart
          labels={forecast.labels}
          values={forecast.visits}
          label="Визиты"
          color="#17181C"
          height={320}
        />
      </Box>
      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1.25 }}>
          Оплаты
        </Typography>
        <DailyForecastChart
          labels={forecast.labels}
          values={forecast.payments}
          label="Оплаты"
          color="#FFC400"
          height={320}
        />
      </Box>
      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1.25 }}>
          Выручка
        </Typography>
        <DailyForecastChart
          labels={forecast.labels}
          values={forecast.revenue}
          label="Выручка"
          kind="money"
          color="#1E8E3E"
          height={320}
        />
      </Box>
    </Box>
  );
}
