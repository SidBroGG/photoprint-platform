export type IssueArea = "sales" | "production" | "logistics" | "service";

export type IssueStatus = "new" | "in_progress" | "review" | "done";

export type IssueCriticality = "low" | "medium" | "high" | "critical";

export interface Issue {
  id: string;
  number: number;
  area: IssueArea;
  title: string;
  description: string;
  status: IssueStatus;
  criticality: IssueCriticality;
  assigneeId: string | null;
  assigneeName: string | null;
  createdById: string;
  createdByName: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateIssueInput {
  area: IssueArea;
  title: string;
  description: string;
  criticality: IssueCriticality;
}

export interface UpdateIssueInput {
  title: string;
  description: string;
  criticality: IssueCriticality;
  status: IssueStatus;
}

export interface IssueActionResult {
  ok: boolean;
  error?: string;
}
