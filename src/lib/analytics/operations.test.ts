import { describe, expect, test } from "bun:test";
import { createDataset } from "@/lib/data/generator";
import { STAGE_CAPACITY } from "@/types/domain";
import {
  isShipmentOverdue,
  logisticsView,
  productionView,
  serviceView,
  stageLoads,
} from "./operations";
import { personnelView } from "./personnel";
import { overdueTickets } from "./metrics";

const NOW = new Date("2026-11-11T09:30:00Z");
const dataset = createDataset(NOW);

describe("production operations", () => {
  test("detects the binding bottleneck and overdue orders", () => {
    const stages = stageLoads(dataset.orders);
    expect(stages).toHaveLength(3);
    const binding = stages.find((stage) => stage.stage === "binding");
    expect(binding?.queue).toBeGreaterThanOrEqual(STAGE_CAPACITY.binding);
    expect(binding?.isBottleneck).toBe(true);
    expect(binding?.loadPct).toBeGreaterThanOrEqual(1);

    const view = productionView(dataset.orders, NOW);
    expect(view.inProduction).toBeGreaterThan(0);
    expect(view.overdue).toBeGreaterThanOrEqual(3);
    expect(view.ready).toBeGreaterThan(0);
    expect(view.riskOrders[0]!.dueAt.getTime()).toBeLessThanOrEqual(
      view.riskOrders[view.riskOrders.length - 1]!.dueAt.getTime(),
    );
    expect(view.compliance).toBeGreaterThan(0.7);
  });

  test("scopes a specialist to their own queue without company aggregates", () => {
    const view = productionView(dataset.orders, NOW, "e08");
    expect(view.stages).toHaveLength(0);
    const assigned = dataset.orders.filter(
      (order) =>
        order.productionEmployeeId === "e08" &&
        ["prepress", "print", "binding"].includes(order.stage),
    );
    expect(view.inProduction).toBe(assigned.length);
    expect(view.inProduction).toBeGreaterThan(0);
  });
});

describe("logistics operations", () => {
  test("builds shipment rows with tracking and delayed cases", () => {
    const view = logisticsView(dataset, NOW);
    expect(view.inTransit).toBeGreaterThan(0);
    expect(view.deliveredLast30).toBeGreaterThan(0);
    expect(view.overdue).toBeGreaterThanOrEqual(3);
    expect(view.onTimeRate).toBeGreaterThan(0.7);
    expect(view.onTimeRate).toBeLessThanOrEqual(1);
    const delayed = view.rows.filter((row) => row.shipment?.status === "delayed");
    expect(delayed.length).toBeGreaterThanOrEqual(3);
    expect(delayed.every((row) => isShipmentOverdue(row.shipment, NOW))).toBe(true);
    expect(view.rows[0]?.shipment).not.toBeNull();
    expect(view.rows.some((row) => row.shipment === null)).toBe(true);
  });
});

describe("service operations", () => {
  test("reports overdue SLA tickets and sorts them first", () => {
    const view = serviceView(dataset, NOW);
    expect(view.open).toBeGreaterThanOrEqual(3);
    expect(view.overdue).toBeGreaterThanOrEqual(3);
    expect(view.closedLast30).toBeGreaterThan(0);
    expect(view.averageFirstResponseHours).toBeGreaterThan(0);
    const overdue = overdueTickets(dataset.tickets, NOW);
    expect(view.rows.slice(0, overdue.length).every((ticket) => ticket.status !== "closed")).toBe(
      true,
    );
  });

  test("scopes a service specialist to assigned tickets", () => {
    const view = serviceView(dataset, NOW, "e17");
    expect(view.rows.length).toBeGreaterThan(0);
    expect(view.rows.every((ticket) => ticket.assigneeId === "e17")).toBe(true);
    expect(view.overdue).toBeGreaterThan(0);
  });
});

describe("personnel workload", () => {
  test("finds overloaded employees and overdue tasks", () => {
    const view = personnelView(dataset, NOW);
    expect(view.headcount).toBe(dataset.employees.length);
    expect(view.overloaded).toBeGreaterThan(0);
    expect(view.overdueTasks).toBeGreaterThan(0);
    expect(view.workloads.some((row) => row.loadPct > 1)).toBe(true);
    expect(view.workloads[0]!.loadPct).toBeGreaterThanOrEqual(
      view.workloads[view.workloads.length - 1]!.loadPct,
    );
  });

  test("scopes departments for managers", () => {
    const production = personnelView(dataset, NOW, ["production"]);
    expect(production.headcount).toBe(
      dataset.employees.filter((employee) => employee.department === "production").length,
    );
    expect(
      production.workloads.every(
        (row) => row.employee.department === "production",
      ),
    ).toBe(true);

    const service = personnelView(dataset, NOW, ["logistics", "service"]);
    expect(
      service.workloads.every(
        (row) =>
          row.employee.department === "logistics" || row.employee.department === "service",
      ),
    ).toBe(true);
  });
});
