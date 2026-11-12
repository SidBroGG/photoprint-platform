import type { DemoAccount } from "@/lib/auth/roles";
import { personnelDepartments } from "@/lib/auth/roles";
import {
  ISSUE_AREA_LABELS,
  ISSUE_CRITICALITY_LABELS,
  issueCriticalityRank,
  issueCriticalityTone,
  visibleIssueAreas,
} from "@/lib/board/labels";
import { getIssueStore } from "@/lib/board/store";
import { getDataset } from "@/lib/data/store";
import { DEPARTMENT_LABELS } from "@/lib/labels";
import { formatDateTime, formatNumber } from "@/lib/format";
import type { KpiVM } from "@/lib/view/dashboard";
import type {
  Issue,
  IssueArea,
  IssueCriticality,
  IssueStatus,
} from "@/types/board";
import type { Tone } from "@/lib/labels";

export interface IssueCardVM {
  id: string;
  title: string;
  description: string;
  status: IssueStatus;
  area: IssueArea;
  areaLabel: string;
  criticality: IssueCriticality;
  criticalityLabel: string;
  criticalityTone: Tone;
  assigneeId: string | null;
  assigneeName: string | null;
  isMine: boolean;
  canClaim: boolean;
  canRelease: boolean;
  createdByName: string;
  updatedAtLabel: string;
}

export interface IssueAssigneeVM {
  id: string;
  name: string;
  role: string;
  departmentLabel: string;
}

export interface IssueAreaVM {
  area: IssueArea;
  label: string;
}

export interface IssueBoardView {
  meta: string;
  note: string;
  stats: KpiVM[];
  issues: IssueCardVM[];
  areas: IssueAreaVM[];
  createAreas: IssueAreaVM[];
  assignees: IssueAssigneeVM[];
  defaultArea: IssueArea;
  showAreaChips: boolean;
}

const ROLE_NOTES: Record<string, string> = {
  ceo:
    "Все процессы компании, разделённые по категориям. Закрепляйте задачи за собой, назначайте сотрудникам и переводите по статусам.",
  sales:
    "Проблемы и процессы направления продаж и финансов. Назначайте задачи сотрудникам направления или закрепляйте за собой.",
  production:
    "Проблемы и процессы производства. Назначайте задачи подчинённым, перетаскивайте карточки между колонками или меняйте статус.",
  logistics_service:
    "Процессы логистики и клиентского сервиса. Назначайте задачи сотрудникам направления и контролируйте критичность.",
  marketing:
    "Задачи маркетинга: кампании, каналы, конверсия и бюджет. Назначайте задачи команде или закрепляйте за собой.",
};

export function getIssueBoardView(
  account: DemoAccount,
  now: Date = new Date(),
): IssueBoardView {
  const store = getIssueStore(now);
  const allowedAreas = visibleIssueAreas(account.role);
  const scoped = store.issues.filter((issue) => allowedAreas.includes(issue.area));
  const sorted = scoped
    .slice()
    .sort((a, b) => {
      const rank = issueCriticalityRank(b.criticality) - issueCriticalityRank(a.criticality);
      if (rank !== 0) return rank;
      return b.updatedAt.getTime() - a.updatedAt.getTime();
    });

  function isAssignedToMe(issue: Issue): boolean {
    return (
      issue.assigneeId === account.id ||
      (account.employeeId !== undefined && issue.assigneeId === account.employeeId)
    );
  }

  const issues: IssueCardVM[] = sorted.map((issue) => ({
    id: issue.id,
    title: issue.title,
    description: issue.description,
    status: issue.status,
    area: issue.area,
    areaLabel: ISSUE_AREA_LABELS[issue.area],
    criticality: issue.criticality,
    criticalityLabel: ISSUE_CRITICALITY_LABELS[issue.criticality],
    criticalityTone: issueCriticalityTone(issue.criticality),
    assigneeId: issue.assigneeId,
    assigneeName: issue.assigneeName,
    isMine: isAssignedToMe(issue),
    canClaim: issue.assigneeId === null,
    canRelease: isAssignedToMe(issue),
    createdByName: issue.createdByName,
    updatedAtLabel: formatDateTime(issue.updatedAt),
  }));

  const openIssues = scoped.filter((issue) => issue.status !== "done");
  const inProgress = openIssues.filter((issue) => issue.status === "in_progress");
  const critical = openIssues.filter((issue) => issue.criticality === "critical");
  const mine = openIssues.filter(isAssignedToMe);

  const stats: KpiVM[] = [
    {
      label: "Открытые задачи",
      value: formatNumber(openIssues.length),
      hint: "Все, кроме решённых",
    },
    {
      label: "В работе",
      value: formatNumber(inProgress.length),
      hint: "Взяты в работу сотрудниками",
    },
    {
      label: "Критичные",
      value: formatNumber(critical.length),
      hint: "Требуют первоочередного решения",
      tone: critical.length > 0 ? "error" : "default",
    },
    {
      label: "Мои задачи",
      value: formatNumber(mine.length),
      hint: "Открытые и закреплённые за вами",
      tone: mine.length > 0 ? "accent" : "default",
    },
  ];

  const areas: IssueAreaVM[] = allowedAreas.map((area) => ({
    area,
    label: ISSUE_AREA_LABELS[area],
  }));

  const departments = personnelDepartments(account.role);
  const assignees: IssueAssigneeVM[] = getDataset(now)
    .employees.filter(
      (employee) =>
        (!departments || departments.includes(employee.department)) &&
        employee.id !== account.employeeId,
    )
    .sort((a, b) => a.name.localeCompare(b.name, "ru"))
    .map((employee) => ({
      id: employee.id,
      name: employee.name,
      role: employee.role,
      departmentLabel: DEPARTMENT_LABELS[employee.department],
    }));

  return {
    meta: `Данные на ${formatDateTime(now)} · изменения сохраняются в памяти сервера`,
    note:
      ROLE_NOTES[account.role] ??
      "Только задачи вашего процесса. Закрепите задачу за собой, чтобы взять её в работу.",
    stats,
    issues,
    areas,
    createAreas: areas,
    assignees,
    defaultArea: allowedAreas[0] ?? "sales",
    showAreaChips: areas.length > 1,
  };
}
