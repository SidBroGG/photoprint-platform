import type { DemoAccount } from "@/lib/auth/roles";
import { personnelDepartments } from "@/lib/auth/roles";
import { getDataset } from "@/lib/data/store";
import { personnelView } from "@/lib/analytics/personnel";
import { getIssueStore } from "@/lib/board/store";
import { DEPARTMENT_LABELS } from "@/lib/labels";
import { formatDateTime, formatNumber, formatPercent } from "@/lib/format";
import type { KpiVM } from "@/lib/view/dashboard";

export interface PersonnelRowVM {
  id: string;
  name: string;
  role: string;
  departmentLabel: string;
  activeTasks: number;
  norm: number;
  loadPct: number;
  loadLabel: string;
  overdueTasks: number;
  isOverloaded: boolean;
}

export interface PersonnelOverdueVM {
  id: string;
  employeeName: string;
  label: string;
  href: string;
  kindLabel: string;
}

export interface PersonnelScreenView {
  meta: string;
  scopeLabel: string;
  kpis: KpiVM[];
  rows: PersonnelRowVM[];
  overdue: PersonnelOverdueVM[];
}

const KIND_LABELS: Record<string, string> = {
  order: "Заказ",
  ticket: "Обращение",
  shipment: "Отправление",
};

export function getPersonnelScreenView(
  account: DemoAccount,
  now: Date = new Date(),
): PersonnelScreenView {
  const dataset = getDataset(now);
  const departments = personnelDepartments(account.role);
  const marketingIssues = getIssueStore(now).issues.filter(
    (issue) => issue.area === "marketing",
  );
  const view = personnelView(dataset, now, departments, marketingIssues);
  const employeeById = new Map(dataset.employees.map((employee) => [employee.id, employee]));
  const scopeLabel = departments
    ? departments.map((department) => DEPARTMENT_LABELS[department]).join(", ")
    : "Все отделы";

  return {
    meta: `Срез: ${scopeLabel} · ${formatNumber(view.headcount)} сотрудников · ${formatDateTime(now)}`,
    scopeLabel,
    kpis: [
      {
        label: "Численность",
        value: formatNumber(view.headcount),
        hint: "Активные сотрудники",
      },
      {
        label: "Средняя загрузка",
        value: formatPercent(view.averageLoad, 0),
        hint: "Задачи / дневная норма",
      },
      {
        label: "Перегруженные",
        value: formatNumber(view.overloaded),
        hint: "Загрузка выше 100%",
        tone: view.overloaded > 0 ? "warning" : "success",
      },
      {
        label: "Просроченные задачи",
        value: formatNumber(view.overdueTasks),
        hint: "Заказы, обращения и отправления",
        tone: view.overdueTasks > 0 ? "error" : "default",
      },
    ],
    rows: view.workloads.map((row) => ({
      id: row.employee.id,
      name: row.employee.name,
      role: row.employee.role,
      departmentLabel: DEPARTMENT_LABELS[row.employee.department],
      activeTasks: row.activeTasks,
      norm: row.employee.dailyNorm,
      loadPct: row.loadPct,
      loadLabel: formatPercent(row.loadPct, 0),
      overdueTasks: row.overdueTasks,
      isOverloaded: row.isOverloaded,
    })),
    overdue: view.overdueItems.map((item) => ({
      id: item.id,
      employeeName: employeeById.get(item.employeeId)?.name ?? "—",
      label: item.label,
      href: item.href,
      kindLabel: KIND_LABELS[item.kind] ?? item.kind,
    })),
  };
}
