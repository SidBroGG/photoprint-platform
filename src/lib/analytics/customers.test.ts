import { describe, expect, test } from "bun:test";
import { createDataset } from "@/lib/data/generator";
import { buildCustomerAnalytics, coefficientOfVariation, xyzClass } from "./customers";
import { buildProductAnalytics } from "./products";

const NOW = new Date("2026-11-11T09:30:00Z");
const dataset = createDataset(NOW);

describe("customer analytics", () => {
  const analytics = buildCustomerAnalytics(dataset, NOW);

  test("ABC classes cover the total revenue exactly", () => {
    const abcRevenue = analytics.rows.reduce((sum, row) => sum + row.revenue, 0);
    expect(abcRevenue).toBe(analytics.totalRevenue);
    const classes = analytics.rows.filter((row) => row.abc === "A");
    expect(classes.length).toBeGreaterThan(0);
    const classARevenue = classes.reduce((sum, row) => sum + row.revenue, 0);
    expect(classARevenue).toBeLessThanOrEqual(analytics.totalRevenue * 0.81);
    expect(analytics.rows.filter((row) => row.abc === "C").length).toBeGreaterThan(0);
  });

  test("XYZ classes are valid and matrix sums match", () => {
    for (const row of analytics.rows) {
      expect(["A", "B", "C"]).toContain(row.abc);
      expect(["X", "Y", "Z"]).toContain(row.xyz);
      expect(row.ltv).toBe(row.revenue);
      expect(row.monthlyOrders).toHaveLength(6);
    }
    expect(analytics.matrix.reduce((sum, cell) => sum + cell.clients, 0)).toBe(
      dataset.clients.length,
    );
    const revenueShare = analytics.matrix.reduce(
      (sum, cell) => sum + cell.revenueShare,
      0,
    );
    expect(revenueShare).toBeCloseTo(1, 5);
  });

  test("repeat sales and LTV stay within sensible bounds", () => {
    expect(analytics.repeatSalesShare).toBeGreaterThanOrEqual(0);
    expect(analytics.repeatSalesShare).toBeLessThanOrEqual(1);
    expect(analytics.averageLtv).toBeGreaterThan(0);
    expect(analytics.topClientsShare).toBeGreaterThan(0.1);
    expect(analytics.topClientsShare).toBeLessThan(1);
    expect(analytics.activeClients).toBeGreaterThan(0);
  });

  test("coefficient of variation and XYZ thresholds", () => {
    expect(coefficientOfVariation([2, 2, 2, 2, 2, 2])).toBe(0);
    expect(xyzClass(0.1, 2)).toBe("X");
    expect(xyzClass(0.5, 2)).toBe("Y");
    expect(xyzClass(0.8, 2)).toBe("Z");
    expect(xyzClass(0, 0)).toBe("Z");
  });
});

describe("product analytics", () => {
  const analytics = buildProductAnalytics(dataset, NOW);

  test("has twelve months and three-month peak context", () => {
    expect(analytics.months).toHaveLength(12);
    expect(analytics.rows).toHaveLength(dataset.products.length);
    expect(analytics.months.some((month) => month.orders > 0)).toBe(true);
    expect(analytics.peakMonthKey.length).toBe(7);
  });

  test("marks discontinued positions with no sales for 60+ days", () => {
    expect(analytics.discontinued.length).toBeGreaterThanOrEqual(2);
    for (const row of analytics.discontinued) {
      expect(row.isDiscontinued).toBe(true);
      if (row.lastOrderAt) {
        const days =
          (NOW.getTime() - row.lastOrderAt.getTime()) / (24 * 60 * 60 * 1000);
        expect(days).toBeGreaterThanOrEqual(60);
      }
    }
    const lowMargin = analytics.rows.find((row) => row.product.id === "p11");
    expect(lowMargin?.marginPct).toBeLessThan(0.25);
    expect(lowMargin?.ordersLast30).toBeGreaterThan(0);
  });

  test("margin and revenue are consistent", () => {
    expect(analytics.totalRevenue).toBeGreaterThan(0);
    expect(analytics.weightedMarginPct).toBeGreaterThan(0);
    expect(analytics.weightedMarginPct).toBeLessThan(1);
    expect(analytics.repeatShare).toBeGreaterThan(0);
    expect(analytics.repeatShare).toBeLessThanOrEqual(1);
    expect(analytics.rows.map((row) => row.peakMonthKey.length)).toEqual(
      analytics.rows.map(() => 7),
    );
  });
});
