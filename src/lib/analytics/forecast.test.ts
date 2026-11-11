import { describe, expect, test } from "bun:test";
import { createDataset } from "@/lib/data/generator";
import { buildForecast, linearRegression } from "./forecast";
import { STAGE_CAPACITY } from "@/types/domain";

const NOW = new Date("2026-11-11T09:30:00Z");
const dataset = createDataset(NOW);
const forecast = buildForecast(dataset, NOW);

describe("linear regression", () => {
  test("recovers a clean linear trend", () => {
    const result = linearRegression([2, 4, 6]);
    expect(result.slope).toBeCloseTo(2, 6);
    expect(result.intercept).toBeCloseTo(2, 6);
  });

  test("handles short and flat series", () => {
    expect(linearRegression([])).toEqual({ intercept: 0, slope: 0 });
    expect(linearRegression([5])).toEqual({ intercept: 5, slope: 0 });
    expect(linearRegression([3, 3, 3]).slope).toBe(0);
  });
});

describe("forecast", () => {
  test("builds a 21-day non-negative forecast", () => {
    expect(forecast.daily).toHaveLength(21);
    for (const point of forecast.daily) {
      expect(point.orders).toBeGreaterThanOrEqual(0);
      expect(point.revenue).toBeGreaterThanOrEqual(0);
      expect(point.shipments).toBeGreaterThanOrEqual(0);
      expect(Number.isFinite(point.orders)).toBe(true);
    }
  });

  test("compares demand with every production stage", () => {
    expect(forecast.stageRisks).toHaveLength(3);
    for (const stage of forecast.stageRisks) {
      expect(stage.capacity).toBe(STAGE_CAPACITY[stage.stage]);
      expect(stage.overloadDays14).toBeGreaterThanOrEqual(0);
      expect(stage.overloadDays14).toBeLessThanOrEqual(14);
    }
    const binding = forecast.stageRisks.find((stage) => stage.stage === "binding");
    expect(binding?.overloadDays14).toBeGreaterThan(0);
  });

  test("produces overload risks for the demo dataset", () => {
    expect(forecast.risks.length).toBeGreaterThan(0);
    expect(forecast.risks.some((risk) => risk.id === "forecast_overload:binding")).toBe(
      true,
    );
    expect(forecast.risks.every((risk) => risk.reason.length > 0 && risk.action.length > 0)).toBe(
      true,
    );
  });

  test("builds 12 history months and 3 forecast months", () => {
    expect(forecast.longTerm).toHaveLength(15);
    expect(forecast.longTerm.filter((point) => point.isForecast)).toHaveLength(3);
    const history = forecast.longTerm.filter((point) => !point.isForecast);
    const future = forecast.longTerm.filter((point) => point.isForecast);
    expect(history).toHaveLength(12);
    expect(future.every((point) => point.orders >= 0 && point.revenue >= 0)).toBe(true);
    expect(new Set(forecast.longTerm.map((point) => point.key)).size).toBe(15);
  });

  test("keeps the delivery share in a valid range", () => {
    expect(forecast.deliveryShare).toBeGreaterThan(0);
    expect(forecast.deliveryShare).toBeLessThanOrEqual(1);
  });
});
