import type { Role } from "@/lib/auth/roles";
import type { Tone } from "@/lib/labels";
import type { IssueArea, IssueCriticality, IssueStatus } from "@/types/board";

export const ISSUE_AREAS: IssueArea[] = ["sales", "production", "logistics", "service"];

export const ISSUE_STATUSES: IssueStatus[] = ["new", "in_progress", "done"];

export const ISSUE_CRITICALITIES: IssueCriticality[] = [
  "low",
  "medium",
  "high",
  "critical",
];

export const ISSUE_AREA_LABELS: Record<IssueArea, string> = {
  sales: "Продажи",
  production: "Производство",
  logistics: "Логистика",
  service: "Клиентский сервис",
};

export const ISSUE_STATUS_LABELS: Record<IssueStatus, string> = {
  new: "Новые",
  in_progress: "В работе",
  done: "Решено",
};

export const ISSUE_CRITICALITY_LABELS: Record<IssueCriticality, string> = {
  low: "Низкая",
  medium: "Средняя",
  high: "Высокая",
  critical: "Критичная",
};

export function visibleIssueAreas(role: Role): IssueArea[] {
  switch (role) {
    case "ceo":
      return [...ISSUE_AREAS];
    case "sales":
      return ["sales"];
    case "production":
    case "production_specialist":
      return ["production"];
    case "logistics_service":
      return ["logistics", "service"];
    case "service_specialist":
      return ["service"];
  }
}

export function issueCriticalityTone(criticality: IssueCriticality): Tone {
  switch (criticality) {
    case "low":
      return "neutral";
    case "medium":
      return "info";
    case "high":
      return "warning";
    case "critical":
      return "error";
  }
}

export function issueCriticalityRank(criticality: IssueCriticality): number {
  switch (criticality) {
    case "low":
      return 0;
    case "medium":
      return 1;
    case "high":
      return 2;
    case "critical":
      return 3;
  }
}
