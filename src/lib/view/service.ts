import type { DemoAccount } from "@/lib/auth/roles";
import { getDataset } from "@/lib/data/store";
import { serviceView } from "@/lib/analytics/operations";
import { TICKET_STATUS_LABELS, ticketTone, type Tone } from "@/lib/labels";
import { formatDateTime, formatHours, formatNumber } from "@/lib/format";
import type { KpiVM } from "@/lib/view/dashboard";

export interface ServiceRowVM {
  id: string;
  topic: string;
  clientName: string;
  orderId: string;
  openedLabel: string;
  slaLabel: string;
  firstResponseLabel: string;
  statusLabel: string;
  statusTone: Tone;
  assigneeName: string;
  overdue: boolean;
}

export interface ServiceScreenView {
  mode: "company" | "specialist";
  meta: string;
  note: string;
  kpis: KpiVM[];
  rows: ServiceRowVM[];
}

export function getServiceScreenView(
  account: DemoAccount,
  now: Date = new Date(),
): ServiceScreenView {
  const dataset = getDataset(now);
  const specialist = account.role === "service_specialist";
  const view = serviceView(dataset, now, specialist ? account.employeeId : undefined);
  const clientById = new Map(dataset.clients.map((client) => [client.id, client]));
  const employeeById = new Map(dataset.employees.map((employee) => [employee.id, employee]));

  const rows: ServiceRowVM[] = view.rows.map((ticket) => {
    const overdue =
      ticket.status !== "closed" && ticket.slaDueAt.getTime() < now.getTime();
    return {
      id: ticket.id,
      topic: ticket.topic,
      clientName: clientById.get(ticket.clientId)?.name ?? "—",
      orderId: ticket.orderId,
      openedLabel: formatDateTime(ticket.openedAt),
      slaLabel: formatDateTime(ticket.slaDueAt),
      firstResponseLabel: ticket.firstResponseAt
        ? formatDateTime(ticket.firstResponseAt)
        : "Нет ответа",
      statusLabel: TICKET_STATUS_LABELS[ticket.status],
      statusTone: ticketTone(ticket.status),
      assigneeName: employeeById.get(ticket.assigneeId)?.name ?? "—",
      overdue,
    };
  });

  return {
    mode: specialist ? "specialist" : "company",
    meta: `Активные обращения и закрытые за 30 дней · ${formatNumber(rows.length)} записей · ${formatDateTime(now)}`,
    note: specialist
      ? "Показаны только назначенные вам обращения и ваши сроки SLA."
      : "Открытые обращения, просрочки SLA и скорость первого ответа.",
    kpis: [
      {
        label: specialist ? "Мои открытые" : "Открытые обращения",
        value: formatNumber(view.open),
        hint: "Открыто и в работе",
      },
      {
        label: "Просрочка SLA",
        value: formatNumber(view.overdue),
        hint: "Срок первого ответа истёк",
        tone: view.overdue > 0 ? "error" : "default",
      },
      {
        label: "Закрыто, 30 дней",
        value: formatNumber(view.closedLast30),
        hint: "За последние 30 дней",
      },
      {
        label: "Первый ответ",
        value: view.averageFirstResponseHours > 0 ? formatHours(view.averageFirstResponseHours) : "—",
        hint: "Среднее время, 30 дней",
      },
    ],
    rows,
  };
}
