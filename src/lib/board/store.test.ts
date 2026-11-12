import { beforeEach, describe, expect, test } from "bun:test";
import {
  assignIssue,
  claimIssue,
  createIssue,
  createSeedIssues,
  getIssueStore,
  releaseIssue,
  resetIssueStore,
  setIssueStatus,
  updateIssue,
  type IssueActor,
} from "./store";
import type { IssueCriticality } from "@/types/board";

const NOW = new Date("2026-11-11T09:30:00Z");

const SALES: IssueActor = {
  id: "sales",
  name: "Игорь Волков",
  role: "sales",
  employeeId: "e01",
};
const CEO: IssueActor = { id: "ceo", name: "Анна Смирнова", role: "ceo" };
const PRODUCTION: IssueActor = {
  id: "production",
  name: "Мария Кузнецова",
  role: "production",
  employeeId: "e05",
};
const SERVICE: IssueActor = {
  id: "service",
  name: "Дмитрий Орлов",
  role: "logistics_service",
  employeeId: "e14",
};
const MARKETING: IssueActor = {
  id: "marketing",
  name: "Екатерина Соколова",
  role: "marketing",
  employeeId: "e19",
};

describe("issue store", () => {
  beforeEach(() => {
    resetIssueStore();
  });

  test("seeds four tasks per category with unique IDs", () => {
    const issues = createSeedIssues(NOW);
    expect(issues).toHaveLength(20);
    const ids = issues.map((issue) => issue.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const area of [
      "sales",
      "production",
      "logistics",
      "service",
      "marketing",
    ] as const) {
      expect(issues.filter((issue) => issue.area === area)).toHaveLength(4);
    }
    for (const status of ["new", "in_progress", "done"] as const) {
      expect(issues.some((issue) => issue.status === status)).toBe(true);
    }
    for (const criticality of ["low", "medium", "high", "critical"] as const) {
      expect(issues.some((issue) => issue.criticality === criticality)).toBe(true);
    }
    expect(issues.some((issue) => issue.assigneeId === null)).toBe(true);
  });

  test("claims and releases an unassigned task", () => {
    const state = getIssueStore(NOW);
    const issue = state.issues.find(
      (item) => item.area === "sales" && item.assigneeId === null,
    )!;
    expect(claimIssue(state, SALES, issue.id).ok).toBe(true);
    expect(issue.assigneeId).toBe(SALES.id);
    expect(issue.assigneeName).toBe(SALES.name);
    expect(claimIssue(state, CEO, issue.id).ok).toBe(false);
    expect(releaseIssue(state, SALES, issue.id).ok).toBe(true);
    expect(issue.assigneeId).toBeNull();
    expect(releaseIssue(state, SALES, issue.id).ok).toBe(false);
  });

  test("treats tasks assigned to the linked employee as mine", () => {
    const state = getIssueStore(NOW);
    const issue = state.issues.find(
      (item) => item.area === "sales" && item.assigneeId === null,
    )!;
    issue.assigneeId = "e01";
    issue.assigneeName = "Игорь Волков";

    expect(claimIssue(state, SALES, issue.id).ok).toBe(true);
    expect(issue.assigneeId).toBe("e01");
    expect(releaseIssue(state, SALES, issue.id).ok).toBe(true);
    expect(issue.assigneeId).toBeNull();
  });

  test("assigns tasks only to subordinates of the manager's direction", () => {
    const state = getIssueStore(NOW);
    const salesIssue = state.issues.find(
      (item) => item.area === "sales" && item.assigneeId === null,
    )!;
    const productionIssue = state.issues.find(
      (item) => item.area === "production" && item.assigneeId === null,
    )!;
    const marketingIssue = state.issues.find(
      (item) => item.area === "marketing" && item.assigneeId === null,
    )!;
    const serviceIssue = state.issues.find(
      (item) => item.area === "service" && item.assigneeId === null,
    )!;

    expect(
      assignIssue(state, SALES, salesIssue.id, {
        id: "e02",
        name: "Светлана Белова",
        department: "sales",
      }).ok,
    ).toBe(true);
    expect(salesIssue.assigneeId).toBe("e02");
    expect(salesIssue.assigneeName).toBe("Светлана Белова");
    expect(
      assignIssue(state, SALES, salesIssue.id, {
        id: "e06",
        name: "Сергей Крылов",
        department: "production",
      }).ok,
    ).toBe(false);
    expect(
      assignIssue(state, SALES, salesIssue.id, {
        id: "e01",
        name: "Игорь Волков",
        department: "sales",
      }).ok,
    ).toBe(false);
    expect(
      assignIssue(state, PRODUCTION, salesIssue.id, {
        id: "e06",
        name: "Сергей Крылов",
        department: "production",
      }).ok,
    ).toBe(false);
    expect(
      assignIssue(state, PRODUCTION, productionIssue.id, {
        id: "e06",
        name: "Сергей Крылов",
        department: "production",
      }).ok,
    ).toBe(true);
    expect(
      assignIssue(state, MARKETING, marketingIssue.id, {
        id: "e20",
        name: "Алексей Романов",
        department: "marketing",
      }).ok,
    ).toBe(true);
    expect(
      assignIssue(state, MARKETING, marketingIssue.id, {
        id: "e19",
        name: "Екатерина Соколова",
        department: "marketing",
      }).ok,
    ).toBe(false);
    expect(
      assignIssue(state, CEO, serviceIssue.id, {
        id: "e15",
        name: "Оксана Волкова",
        department: "logistics",
      }).ok,
    ).toBe(true);
  });

  test("does not let a role claim another category", () => {
    const state = getIssueStore(NOW);
    const productionIssue = state.issues.find(
      (item) => item.area === "production" && item.assigneeId === null,
    )!;
    expect(claimIssue(state, SALES, productionIssue.id).ok).toBe(false);
    expect(claimIssue(state, PRODUCTION, productionIssue.id).ok).toBe(true);
  });

  test("lets marketing work only with marketing tasks", () => {
    const state = getIssueStore(NOW);
    const marketingIssue = state.issues.find(
      (item) => item.area === "marketing" && item.assigneeId === null,
    )!;
    expect(claimIssue(state, SALES, marketingIssue.id).ok).toBe(false);
    expect(claimIssue(state, PRODUCTION, marketingIssue.id).ok).toBe(false);
    expect(claimIssue(state, MARKETING, marketingIssue.id).ok).toBe(true);
  });

  test("creates a task in an allowed category and validates input", () => {
    const state = getIssueStore(NOW);
    const before = state.issues.length;
    const result = createIssue(state, SALES, {
      area: "sales",
      title: "  Проверить пречек  ",
      description: "Клиент ждёт подтверждения оплаты.",
      criticality: "high",
    });
    expect(result.ok).toBe(true);
    expect(state.issues).toHaveLength(before + 1);
    const created = state.issues[state.issues.length - 1]!;
    expect(created.title).toBe("Проверить пречек");
    expect(created.status).toBe("new");
    expect(created.assigneeId).toBeNull();
    expect(created.createdById).toBe(SALES.id);

    expect(
      createIssue(state, SALES, {
        area: "production",
        title: "Чужая категория",
        description: "",
        criticality: "low",
      }).ok,
    ).toBe(false);
    expect(
      createIssue(state, SALES, {
        area: "sales",
        title: "ab",
        description: "",
        criticality: "low",
      }).ok,
    ).toBe(false);
    expect(
      createIssue(state, SALES, {
        area: "sales",
        title: "Длинное описание",
        description: "x".repeat(601),
        criticality: "low",
      }).ok,
    ).toBe(false);
    expect(
      createIssue(state, SALES, {
        area: "sales",
        title: "Неверная критичность",
        description: "",
        criticality: "urgent" as IssueCriticality,
      }).ok,
    ).toBe(false);
  });

  test("updates details and status within the allowed category", () => {
    const state = getIssueStore(NOW);
    const issue = state.issues.find((item) => item.area === "sales")!;
    const result = updateIssue(state, SALES, issue.id, {
      title: "Обновлённая проблема",
      description: "Новое описание.",
      criticality: "medium",
      status: "in_progress",
    });
    expect(result.ok).toBe(true);
    expect(issue.title).toBe("Обновлённая проблема");
    expect(issue.status).toBe("in_progress");
    expect(issue.criticality).toBe("medium");

    expect(
      updateIssue(state, SERVICE, issue.id, {
        title: "Чужое изменение",
        description: "",
        criticality: "low",
        status: "new",
      }).ok,
    ).toBe(false);
    expect(
      updateIssue(state, SALES, issue.id, {
        title: "ab",
        description: "",
        criticality: "low",
        status: "new",
      }).ok,
    ).toBe(false);
  });

  test("changes status and protects other categories", () => {
    const state = getIssueStore(NOW);
    const issue = state.issues.find(
      (item) => item.area === "sales" && item.status === "new",
    )!;
    expect(setIssueStatus(state, SALES, issue.id, "in_progress").ok).toBe(true);
    expect(issue.status).toBe("in_progress");
    expect(setIssueStatus(state, SERVICE, issue.id, "done").ok).toBe(false);
  });
});
