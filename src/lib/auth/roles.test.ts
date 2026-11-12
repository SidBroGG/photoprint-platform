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
  "metrics",
];

const ALL_ROLES: Role[] = [
  "ceo",
  "sales",
  "production",
  "logistics_service",
  "marketing",
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
    expect(canAccess("marketing", "metrics")).toBe(true);
    expect(canAccess("marketing", "issues")).toBe(true);
    expect(canAccess("marketing", "personnel")).toBe(true);
    expect(canAccess("marketing", "dashboard")).toBe(true);
    expect(canAccess("marketing", "orders")).toBe(false);
    expect(canAccess("marketing", "customers")).toBe(false);
    expect(canAccess("marketing", "products")).toBe(false);
    expect(canAccess("marketing", "forecast")).toBe(false);
    expect(canAccess("ceo", "metrics")).toBe(true);
  });
});

describe("accounts and routing", () => {
  test("has five unique demo accounts with known home routes", () => {
    expect(DEMO_ACCOUNTS).toHaveLength(5);
    const ids = new Set(DEMO_ACCOUNTS.map((account) => account.id));
    expect(ids.size).toBe(5);
    for (const account of DEMO_ACCOUNTS) {
      expect(findAccount(account.id)?.name).toBe(account.name);
      expect(homeRoute()).toBe(account.home);
      expect(account.roleLabel.length).toBeGreaterThan(0);
      expect(account.description.length).toBeGreaterThan(0);
    }
    expect(findAccount("unknown")).toBeNull();
  });

  test("sends every role to the dashboard", () => {
    expect(homeRoute()).toBe("/dashboard");
    expect(DEMO_ACCOUNTS.every((account) => account.home === homeRoute())).toBe(true);
  });
});

describe("role scopes", () => {
  test("filters navigation by access", () => {
    const ceoNav = navItemsForRole("ceo");
    expect(ceoNav).toHaveLength(ALL_PAGES.length);
    const salesNav = navItemsForRole("sales").map((item) => item.page);
    expect(salesNav).toEqual([
      "dashboard",
      "metrics",
      "issues",
      "orders",
      "customers",
      "products",
      "personnel",
      "forecast",
    ]);
    const marketingNav = navItemsForRole("marketing").map((item) => item.page);
    expect(marketingNav).toEqual(["dashboard", "metrics", "issues", "personnel"]);
  });

  test("scopes dashboard domains", () => {
    expect(dashboardDomains("ceo")).toHaveLength(5);
    expect(dashboardDomains("sales")).toEqual(["sales", "finance"]);
    expect(dashboardDomains("production")).toEqual(["production"]);
    expect(dashboardDomains("logistics_service")).toEqual(["logistics", "service"]);
    expect(dashboardDomains("marketing")).toEqual([]);
  });

  test("masks money only outside sales and CEO", () => {
    expect(canSeeOrderMoney("ceo")).toBe(true);
    expect(canSeeOrderMoney("sales")).toBe(true);
    expect(canSeeOrderMoney("production")).toBe(false);
    expect(canSeeOrderMoney("logistics_service")).toBe(false);
    expect(canSeeOrderMoney("marketing")).toBe(false);
  });

  test("scopes personnel departments", () => {
    expect(personnelDepartments("ceo")).toBeUndefined();
    expect(personnelDepartments("sales")).toEqual(["sales"]);
    expect(personnelDepartments("production")).toEqual(["production"]);
    expect(personnelDepartments("logistics_service")).toEqual(["logistics", "service"]);
    expect(personnelDepartments("marketing")).toEqual(["marketing"]);
  });
});
