import { describe, expect, test } from "bun:test";
import { createDataset, DATA_SEED } from "@/lib/data/generator";
import { moscowDate, moscowDayIndex } from "@/lib/dates";
import { buildMarketingForecast } from "@/lib/analytics/marketingForecast";
import { createMarketingDataset } from "./marketing";

const NOW = new Date("2026-11-11T09:30:00Z");
const dataset = createDataset(NOW, DATA_SEED);
const marketing = createMarketingDataset(dataset, NOW);

describe("createMarketingDataset", () => {
  test("is deterministic for the same dataset and timestamp", () => {
    const second = createMarketingDataset(dataset, NOW);
    expect(second.channels).toEqual(marketing.channels);
    expect(second.daily.map((point) => point.visits)).toEqual(
      marketing.daily.map((point) => point.visits),
    );
    expect(second.totals).toEqual(marketing.totals);
  });

  test("keeps every funnel stage monotonic", () => {
    const counts = [
      marketing.totals.visits,
      marketing.totals.templateSelections,
      marketing.totals.templateModifications,
      marketing.totals.payments,
    ];
    for (let index = 1; index < counts.length; index += 1) {
      expect(counts[index]!).toBeLessThanOrEqual(counts[index - 1]!);
    }

    expect(
      marketing.channels.every(
        (channel) =>
          channel.templateSelections <= channel.visits &&
          channel.templateModifications <= channel.templateSelections &&
          channel.payments <= channel.templateModifications,
      ),
    ).toBe(true);
  });

  test("reconciles payments and revenue with paid orders", () => {
    const today = moscowDayIndex(NOW);
    const from = moscowDate(today - 29, 0, 0);
    const paidOrders = dataset.orders.filter(
      (order) =>
        (order.paymentStatus === "paid" || order.paymentStatus === "sync_error") &&
        order.paidAt !== null &&
        order.paidAt.getTime() >= from.getTime() &&
        order.paidAt.getTime() <= NOW.getTime(),
    );

    expect(marketing.totals.payments).toBe(paidOrders.length);
    expect(marketing.totals.revenue).toBe(
      paidOrders.reduce((sum, order) => sum + order.amount, 0),
    );
    expect(
      marketing.daily.reduce((sum, point) => sum + point.payments, 0),
    ).toBe(paidOrders.length);
  });

  test("sums channel metrics into totals", () => {
    expect(
      marketing.channels.reduce((sum, channel) => sum + channel.visits, 0),
    ).toBe(marketing.totals.visits);
    expect(
      marketing.channels.reduce((sum, channel) => sum + channel.payments, 0),
    ).toBe(marketing.totals.payments);
    expect(
      marketing.channels.reduce((sum, channel) => sum + channel.revenue, 0),
    ).toBe(marketing.totals.revenue);
    expect(
      marketing.channels.reduce((sum, channel) => sum + channel.cost, 0),
    ).toBe(marketing.totals.cost);
  });

  test("builds a deterministic non-negative 21-day forecast", () => {
    const forecast = buildMarketingForecast(marketing, NOW);
    const second = buildMarketingForecast(marketing, NOW);

    expect(forecast).toHaveLength(21);
    expect(second.map((point) => point.visits)).toEqual(
      forecast.map((point) => point.visits),
    );
    for (const point of forecast) {
      expect(point.visits).toBeGreaterThanOrEqual(0);
      expect(point.payments).toBeGreaterThanOrEqual(0);
      expect(point.revenue).toBeGreaterThanOrEqual(0);
    }
  });
});
