import { describe, expect, test } from "bun:test";
import { createDataset } from "@/lib/data/generator";
import { buildAlerts } from "./alerts";

const NOW = new Date("2026-11-11T09:30:00Z");
const dataset = createDataset(NOW);
const alerts = buildAlerts(dataset, NOW);

const EXPECTED_TYPES = [
  "payment_sync",
  "production_overdue",
  "production_bottleneck",
  "delivery_delay",
  "sla_overdue",
  "client_at_risk",
  "low_margin",
  "forecast_overload",
];

describe("alerts", () => {
  test("generates every alert type with stable unique IDs", () => {
    const types = new Set(alerts.map((alert) => alert.type));
    for (const type of EXPECTED_TYPES) {
      expect(types.has(type)).toBe(true);
    }
    const ids = alerts.map((alert) => alert.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const alert of alerts) {
      expect(alert.id.includes(":")).toBe(true);
      expect(alert.id.startsWith(`${alert.type}:`)).toBe(true);
    }
  });

  test("fills the cause, action, owner and due date", () => {
    for (const alert of alerts) {
      expect(alert.title.length).toBeGreaterThan(0);
      expect(alert.where.length).toBeGreaterThan(0);
      expect(alert.reason.length).toBeGreaterThan(0);
      expect(alert.action.length).toBeGreaterThan(0);
      expect(alert.owner.length).toBeGreaterThan(0);
      expect(alert.due.getTime()).toBeGreaterThan(NOW.getTime());
      expect(alert.href.startsWith("/")).toBe(true);
      expect(["critical", "warning"]).toContain(alert.severity);
      expect(["sales", "production", "logistics", "service"]).toContain(alert.domain);
    }
  });

  test("sorts critical alerts before warnings", () => {
    const firstWarning = alerts.findIndex((alert) => alert.severity === "warning");
    if (firstWarning !== -1) {
      expect(
        alerts
          .slice(firstWarning)
          .every((alert) => alert.severity === "warning"),
      ).toBe(true);
    }
    expect(alerts[0]?.severity).toBe("critical");
  });

  test("has the expected guaranteed demo coverage", () => {
    const byType = (type: string) => alerts.filter((alert) => alert.type === type);
    expect(byType("payment_sync").length).toBeGreaterThanOrEqual(2);
    expect(byType("production_overdue").length).toBeGreaterThanOrEqual(3);
    expect(byType("production_bottleneck").length).toBeGreaterThanOrEqual(1);
    expect(byType("delivery_delay").length).toBeGreaterThanOrEqual(3);
    expect(byType("sla_overdue").length).toBeGreaterThanOrEqual(3);
    expect(byType("client_at_risk").length).toBeGreaterThanOrEqual(2);
    expect(byType("low_margin").length).toBeGreaterThanOrEqual(1);
    expect(byType("forecast_overload").length).toBeGreaterThanOrEqual(1);
  });

  test("keeps alert objects stable between runs", () => {
    const second = buildAlerts(createDataset(NOW), NOW);
    expect(second.map((alert) => alert.id)).toEqual(alerts.map((alert) => alert.id));
  });
});
