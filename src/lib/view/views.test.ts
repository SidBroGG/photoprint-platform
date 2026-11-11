import { describe, expect, test } from "bun:test";
import { findAccount } from "@/lib/auth/roles";
import { createDataset } from "@/lib/data/generator";
import { getDashboardView } from "./dashboard";
import { getOrdersView, getOrderDetailView } from "./orders";
import { getProductionScreenView } from "./production";
import { getServiceScreenView } from "./service";
import { getPersonnelScreenView } from "./personnel";
import { getForecastScreenView } from "./forecast";

const NOW = new Date("2026-11-11T09:30:00Z");
const dataset = createDataset(NOW);

describe("view models respect role restrictions", () => {
  test("dashboard KPI sets differ by domain", () => {
    const ceo = getDashboardView(findAccount("ceo")!, NOW);
    const sales = getDashboardView(findAccount("sales")!, NOW);
    const production = getDashboardView(findAccount("production")!, NOW);
    const service = getDashboardView(findAccount("service")!, NOW);

    expect(ceo.kpis).toHaveLength(8);
    expect(sales.kpis.map((kpi) => kpi.label)).toContain("Выручка, 30 дней");
    expect(sales.kpis.map((kpi) => kpi.label)).not.toContain("В производстве");
    expect(production.kpis.map((kpi) => kpi.label)).toContain("В производстве");
    expect(production.kpis.map((kpi) => kpi.label)).not.toContain("Выручка, 30 дней");
    expect(service.kpis.map((kpi) => kpi.label)).toContain("Задержки доставки");
    expect(service.kpis.map((kpi) => kpi.label)).not.toContain("Маржа, 30 дней");

    expect(ceo.stages.map((stage) => stage.key)).toHaveLength(6);
    expect(sales.stages.map((stage) => stage.key)).toEqual(["order", "payment", "delivered"]);
    expect(production.stages.map((stage) => stage.key)).toEqual(["production", "ready"]);
    expect(service.stages.map((stage) => stage.key)).toEqual(["delivery", "delivered"]);
  });

  test("masks order amounts outside sales and CEO", () => {
    const ceo = getOrdersView(findAccount("ceo")!, NOW);
    const sales = getOrdersView(findAccount("sales")!, NOW);
    const production = getOrdersView(findAccount("production")!, NOW);
    const logistics = getOrdersView(findAccount("service")!, NOW);

    expect(ceo.rows.every((row) => row.amountLabel !== null)).toBe(true);
    expect(sales.rows.every((row) => row.amountLabel !== null)).toBe(true);
    expect(production.rows.every((row) => row.amountLabel === null)).toBe(true);
    expect(logistics.rows.every((row) => row.amountLabel === null)).toBe(true);
    expect(production.mode).toBe("production");
    expect(logistics.mode).toBe("logistics");
    expect(production.rows.every((row) => row.paymentKey.length > 0)).toBe(true);
  });

  test("masks the financial block in order details", () => {
    const orderId = dataset.orders[10]!.id;
    const ceo = getOrderDetailView(findAccount("ceo")!, orderId, NOW);
    const production = getOrderDetailView(findAccount("production")!, orderId, NOW);
    const service = getOrderDetailView(findAccount("service")!, orderId, NOW);

    expect(ceo?.canSeeMoney).toBe(true);
    expect(ceo?.amountLabel).not.toBeNull();
    expect(production?.canSeeMoney).toBe(false);
    expect(production?.amountLabel).toBeNull();
    expect(production?.marginLabel).toBeNull();
    expect(service?.amountLabel).toBeNull();
    expect(production?.timeline.length).toBeGreaterThan(3);
    expect(getOrderDetailView(findAccount("ceo")!, "PP-unknown", NOW)).toBeNull();
  });

  test("scopes specialist pages to personal queues", () => {
    const production = getProductionScreenView(findAccount("prod-spec")!, NOW);
    expect(production.mode).toBe("specialist");
    expect(production.stages).toHaveLength(0);
    expect(production.kpis[0]?.label).toBe("В моей очереди");

    const service = getServiceScreenView(findAccount("service-spec")!, NOW);
    expect(service.mode).toBe("specialist");
    expect(service.kpis[0]?.label).toBe("Мои открытые");
  });

  test("scopes personnel departments", () => {
    const production = getPersonnelScreenView(findAccount("production")!, NOW);
    expect(production.scopeLabel).toBe("Производство");
    expect(production.rows.every((row) => row.departmentLabel === "Производство")).toBe(
      true,
    );

    const ceo = getPersonnelScreenView(findAccount("ceo")!, NOW);
    expect(ceo.scopeLabel).toBe("Все отделы");
    expect(ceo.rows.length).toBe(dataset.employees.length);
  });

  test("enables forecast sections by role", () => {
    const ceo = getForecastScreenView(findAccount("ceo")!, NOW);
    expect(ceo.showSales).toBe(true);
    expect(ceo.showProduction).toBe(true);
    expect(ceo.showLogistics).toBe(true);
    expect(ceo.daily.orders).toHaveLength(21);
    expect(ceo.longTerm.labels).toHaveLength(15);

    const sales = getForecastScreenView(findAccount("sales")!, NOW);
    expect(sales.showSales).toBe(true);
    expect(sales.showProduction).toBe(false);
    expect(sales.showLogistics).toBe(false);

    const production = getForecastScreenView(findAccount("production")!, NOW);
    expect(production.showProduction).toBe(true);
    expect(production.showSales).toBe(false);

    const service = getForecastScreenView(findAccount("service")!, NOW);
    expect(service.showLogistics).toBe(true);
    expect(service.showProduction).toBe(false);
  });
});
