import type { Dataset, Department, Employee } from "@/types/domain";
import type { IssueStatus } from "@/types/board";
import { overdueProductionOrders, overdueTickets, openTickets } from "@/lib/analytics/metrics";

export interface PersonnelMarketingIssue {
  assigneeName: string | null;
  status: IssueStatus;
}

export interface OverdueItem {
  id: string;
  employeeId: string;
  label: string;
  href: string;
  kind: "order" | "ticket" | "shipment";
}

export interface EmployeeWorkload {
  employee: Employee;
  activeTasks: number;
  overdueTasks: number;
  loadPct: number;
  isOverloaded: boolean;
  overdueItems: OverdueItem[];
}

export interface PersonnelView {
  headcount: number;
  averageLoad: number;
  overloaded: number;
  overdueTasks: number;
  workloads: EmployeeWorkload[];
  overdueItems: OverdueItem[];
}

const ACTIVE_ORDER_STAGES = new Set([
  "new",
  "awaiting_payment",
  "prepress",
  "print",
  "binding",
  "ready",
]);

export function personnelView(
  dataset: Dataset,
  now: Date,
  departments?: Department[],
  marketingIssues: readonly PersonnelMarketingIssue[] = [],
): PersonnelView {
  const allowedDepartments = departments ? new Set(departments) : null;
  const employees = dataset.employees.filter(
    (employee) =>
      employee.active &&
      (!allowedDepartments || allowedDepartments.has(employee.department)),
  );
  const overdueOrders = overdueProductionOrders(dataset.orders, now);
  const overdueRequests = overdueTickets(dataset.tickets, now);

  const workloads: EmployeeWorkload[] = employees.map((employee) => {
    const overdueItems: OverdueItem[] = [];
    let activeTasks = 0;

    if (employee.department === "production") {
      const assigned = dataset.orders.filter(
        (order) =>
          order.productionEmployeeId === employee.id &&
          (order.stage === "prepress" ||
            order.stage === "print" ||
            order.stage === "binding" ||
            order.stage === "ready"),
      );
      activeTasks = assigned.length;
      for (const order of overdueOrders) {
        if (order.productionEmployeeId === employee.id) {
          overdueItems.push({
            id: `order:${order.id}`,
            employeeId: employee.id,
            label: `Заказ ${order.id}`,
            href: `/orders/${order.id}`,
            kind: "order",
          });
        }
      }
    } else if (employee.department === "sales") {
      const assigned = dataset.orders.filter(
        (order) =>
          order.managerId === employee.id && ACTIVE_ORDER_STAGES.has(order.stage),
      );
      activeTasks = assigned.length;
      for (const order of overdueOrders) {
        if (order.managerId === employee.id) {
          overdueItems.push({
            id: `order:${order.id}`,
            employeeId: employee.id,
            label: `Заказ ${order.id}`,
            href: `/orders/${order.id}`,
            kind: "order",
          });
        }
      }
    } else if (employee.department === "logistics") {
      const assigned = dataset.shipments.filter(
        (shipment) =>
          shipment.coordinatorId === employee.id && shipment.status !== "delivered",
      );
      activeTasks = assigned.length;
      for (const shipment of assigned) {
        if (shipment.eta.getTime() < now.getTime()) {
          const order = dataset.orders.find((item) => item.id === shipment.orderId);
          overdueItems.push({
            id: `shipment:${shipment.id}`,
            employeeId: employee.id,
            label: `Отправление ${shipment.trackingNumber}`,
            href: order ? `/orders/${order.id}` : "/logistics",
            kind: "shipment",
          });
        }
      }
    } else if (employee.department === "marketing") {
      const assigned = marketingIssues.filter(
        (issue) => issue.assigneeName === employee.name && issue.status !== "done",
      );
      activeTasks = assigned.length;
    } else {
      const assigned = openTickets(dataset.tickets).filter(
        (ticket) => ticket.assigneeId === employee.id,
      );
      activeTasks = assigned.length;
      for (const ticket of overdueRequests) {
        if (ticket.assigneeId === employee.id) {
          overdueItems.push({
            id: `ticket:${ticket.id}`,
            employeeId: employee.id,
            label: `Обращение ${ticket.id}`,
            href: "/service",
            kind: "ticket",
          });
        }
      }
    }

    const loadPct = employee.dailyNorm > 0 ? activeTasks / employee.dailyNorm : 0;
    return {
      employee,
      activeTasks,
      overdueTasks: overdueItems.length,
      loadPct,
      isOverloaded: loadPct > 1,
      overdueItems,
    };
  });

  const overdueItems = workloads.flatMap((row) => row.overdueItems);
  const totalLoad = workloads.reduce((sum, row) => sum + row.loadPct, 0);

  return {
    headcount: employees.length,
    averageLoad: workloads.length > 0 ? totalLoad / workloads.length : 0,
    overloaded: workloads.filter((row) => row.isOverloaded).length,
    overdueTasks: overdueItems.length,
    workloads: workloads.sort((a, b) => b.loadPct - a.loadPct),
    overdueItems,
  };
}
