import { describe, expect, test } from "bun:test";
import {
  DEMO_ACCOUNTS,
  PAGE_ACCESS,
  canAccess,
  canSeeOrderMoney,
  dashboardDomains,
  findAccount,
  homeRoute,
  navItemsForRole,
  personnelDepartments,
  type PageKey,
  type Role,
} from "./roles";

const ALL_PAGES: PageKey[] = [
  "dashboard",
  "issues",
  "orders",
  "customers",
  "products",
  "production",
  "logistics",
  "service",
  "personnel",
  "forecast",
];

const ALL_ROLES: Role[] = [
  "ceo",
  "sales",
  "production",
  "logistics_service",
  "production_specialist",
  "service_specialist",
];

describe("page access matrix", () => {
  test("covers every role and page", () => {
    for (const page of ALL_PAGES) {
      expect(PAGE_ACCESS[page].length).toBeGreaterThan(0);
      for (const role of ALL_ROLES) {
        expect(typeof canAccess(role, page)).toBe("boolean");
      }
    }
  });

  test("matches the plan for managers", () => {
    expect(canAccess("ceo", "dashboard")).toBe(true);
    expect(canAccess("sales", "customers")).toBe(true);
    expect(canAccess("sales", "products")).toBe(true);
    expect(canAccess("sales", "production")).toBe(false);
    expect(canAccess("sales", "logistics")).toBe(false);
    expect(canAccess("production", "production")).toBe(true);
    expect(canAccess("production", "customers")).toBe(false);
    expect(canAccess("production", "logistics")).toBe(false);
    expect(canAccess("production", "service")).toBe(false);
    expect(canAccess("logistics_service", "logistics")).toBe(true);
    expect(canAccess("logistics_service", "service")).toBe(true);
    expect(canAccess("logistics_service", "production")).toBe(false);
    expect(canAccess("logistics_service", "customers")).toBe(false);
    expect(canAccess("logistics_service", "products")).toBe(false);
    expect(canAccess("ceo", "issues")).toBe(true);
    expect(canAccess("sales", "issues")).toBe(true);
    expect(canAccess("production", "issues")).toBe(true);
    expect(canAccess("logistics_service", "issues")).toBe(true);
  });

  test("restricts specialists to their own operational page", () => {
    expect(canAccess("production_specialist", "dashboard")).toBe(false);
    expect(canAccess("production_specialist", "issues")).toBe(true);
    expect(canAccess("production_specialist", "production")).toBe(true);
    expect(canAccess("production_specialist", "orders")).toBe(false);
    expect(canAccess("production_specialist", "personnel")).toBe(false);
    expect(canAccess("service_specialist", "issues")).toBe(true);
    expect(canAccess("service_specialist", "service")).toBe(true);
    expect(canAccess("service_specialist", "dashboard")).toBe(false);
    expect(canAccess("service_specialist", "logistics")).toBe(false);
    expect(canAccess("service_specialist", "orders")).toBe(false);
  });
});

describe("accounts and routing", () => {
  test("has six unique demo accounts with known home routes", () => {
    expect(DEMO_ACCOUNTS).toHaveLength(6);
    const ids = new Set(DEMO_ACCOUNTS.map((account) => account.id));
    expect(ids.size).toBe(6);
    for (const account of DEMO_ACCOUNTS) {
      expect(findAccount(account.id)?.name).toBe(account.name);
      expect(homeRoute(account.role)).toBe(account.home);
      expect(account.roleLabel.length).toBeGreaterThan(0);
      expect(account.description.length).toBeGreaterThan(0);
    }
    expect(findAccount("unknown")).toBeNull();
  });

  test("sends specialists to their home page", () => {
    expect(homeRoute("ceo")).toBe("/dashboard");
    expect(homeRoute("sales")).toBe("/dashboard");
    expect(homeRoute("production")).toBe("/dashboard");
    expect(homeRoute("logistics_service")).toBe("/dashboard");
    expect(homeRoute("production_specialist")).toBe("/production");
    expect(homeRoute("service_specialist")).toBe("/service");
  });
});

describe("role scopes", () => {
  test("filters navigation by access", () => {
    const ceoNav = navItemsForRole("ceo");
    expect(ceoNav).toHaveLength(ALL_PAGES.length);
    const salesNav = navItemsForRole("sales").map((item) => item.page);
    expect(salesNav).toEqual([
      "dashboard",
      "issues",
      "orders",
      "customers",
      "products",
      "personnel",
      "forecast",
    ]);
    expect(navItemsForRole("production_specialist").map((item) => item.page)).toEqual([
      "issues",
      "production",
    ]);
    expect(navItemsForRole("service_specialist").map((item) => item.page)).toEqual([
      "issues",
      "service",
    ]);
  });

  test("scopes dashboard domains", () => {
    expect(dashboardDomains("ceo")).toHaveLength(5);
    expect(dashboardDomains("sales")).toEqual(["sales", "finance"]);
    expect(dashboardDomains("production")).toEqual(["production"]);
    expect(dashboardDomains("logistics_service")).toEqual(["logistics", "service"]);
    expect(dashboardDomains("production_specialist")).toEqual([]);
  });

  test("masks money only outside sales and CEO", () => {
    expect(canSeeOrderMoney("ceo")).toBe(true);
    expect(canSeeOrderMoney("sales")).toBe(true);
    expect(canSeeOrderMoney("production")).toBe(false);
    expect(canSeeOrderMoney("logistics_service")).toBe(false);
    expect(canSeeOrderMoney("production_specialist")).toBe(false);
  });

  test("scopes personnel departments", () => {
    expect(personnelDepartments("ceo")).toBeUndefined();
    expect(personnelDepartments("sales")).toEqual(["sales"]);
    expect(personnelDepartments("production")).toEqual(["production"]);
    expect(personnelDepartments("logistics_service")).toEqual(["logistics", "service"]);
  });
});
