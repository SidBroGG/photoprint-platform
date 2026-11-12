import { describe, expect, test } from "bun:test";
import {
  ISSUE_AREA_LABELS,
  issueCriticalityRank,
  issueCriticalityTone,
  visibleIssueAreas,
} from "./labels";
import type { IssueArea, IssueCriticality } from "@/types/board";

describe("issue board labels and scope", () => {
  test("scopes categories by role", () => {
    expect(visibleIssueAreas("ceo")).toEqual([
      "sales",
      "production",
      "logistics",
      "service",
    ]);
    expect(visibleIssueAreas("sales")).toEqual(["sales"]);
    expect(visibleIssueAreas("production")).toEqual(["production"]);
    expect(visibleIssueAreas("logistics_service")).toEqual(["logistics", "service"]);
    expect(visibleIssueAreas("marketing")).toEqual([]);
  });

  test("labels every category", () => {
    const areas: IssueArea[] = ["sales", "production", "logistics", "service"];
    for (const area of areas) {
      expect(ISSUE_AREA_LABELS[area].length).toBeGreaterThan(0);
    }
  });

  test("orders criticality from low to critical", () => {
    const values: IssueCriticality[] = ["low", "medium", "high", "critical"];
    const ranks = values.map(issueCriticalityRank);
    expect(ranks).toEqual([0, 1, 2, 3]);
    expect(issueCriticalityTone("critical")).toBe("error");
    expect(issueCriticalityTone("high")).toBe("warning");
    expect(issueCriticalityTone("low")).toBe("neutral");
  });
});
