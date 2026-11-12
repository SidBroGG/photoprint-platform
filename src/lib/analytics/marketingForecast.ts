import type { MarketingDataset } from "@/types/marketing";
import { linearRegression } from "@/lib/analytics/forecast";
import { dayStart, moscowDayIndex, weekdayIndex } from "@/lib/dates";

export interface MarketingForecastPoint {
  date: Date;
  visits: number;
  payments: number;
  revenue: number;
}

const WEEKDAY_FACTORS = [1.04, 1.06, 1.02, 1.03, 1, 0.85, 0.8];

export function buildMarketingForecast(
  data: MarketingDataset,
  now: Date = new Date(),
  horizon = 21,
): MarketingForecastPoint[] {
  const history = data.daily;
  const visitsRegression = linearRegression(history.map((point) => point.visits));
  const paymentsRegression = linearRegression(history.map((point) => point.payments));
  const revenueRegression = linearRegression(history.map((point) => point.revenue));
  const todayIndex = moscowDayIndex(now);
  const points: MarketingForecastPoint[] = [];

  for (let index = 0; index < horizon; index += 1) {
    const date = dayStart(todayIndex + 1 + index);
    const weekdayFactor = WEEKDAY_FACTORS[weekdayIndex(date)] ?? 1;
    const trendIndex = history.length + index;
    const visits = Math.max(
      0,
      Math.round(
        (visitsRegression.intercept + visitsRegression.slope * trendIndex) *
          weekdayFactor,
      ),
    );
    const payments = Math.max(
      0,
      Math.round(
        (paymentsRegression.intercept + paymentsRegression.slope * trendIndex) *
          weekdayFactor,
      ),
    );
    const revenue = Math.max(
      0,
      Math.round(
        ((revenueRegression.intercept + revenueRegression.slope * trendIndex) *
          weekdayFactor) /
          100,
      ) * 100,
    );
    points.push({ date, visits, payments, revenue });
  }

  return points;
}
