import type { DemoAccount } from "@/lib/auth/roles";
import { canAccess, canSeeOrderMoney } from "@/lib/auth/roles";
import { getDataset } from "@/lib/data/store";
import type { Order, OrderStage, Shipment, SupportTicket } from "@/types/domain";
import {
  ORDER_STAGE_LABELS,
  PAYMENT_LABELS,
  SHIPMENT_LABELS,
  TICKET_STATUS_LABELS,
  orderStageTone,
  paymentTone,
  shipmentTone,
  ticketTone,
  type Tone,
} from "@/lib/labels";
import { formatDate, formatDateTime, formatMoney, formatMoneyCompact, formatNumber, formatPercent } from "@/lib/format";
import { orderPipeline, periodStart } from "@/lib/analytics/metrics";

export type OrdersMode = "full" | "sales" | "production" | "logistics";

export interface OrderRowVM {
  id: string;
  number: string;
  clientName: string;
  productName: string;
  quantity: number;
  amountLabel: string | null;
  paymentLabel: string;
  paymentTone: Tone;
  paymentKey: string;
  stageLabel: string;
  stageTone: Tone;
  stageKey: OrderStage;
  dueLabel: string;
  dueTone?: Tone;
  overdue: boolean;
  assigneeName: string;
  managerName: string;
  deliveryLabel: string;
  tracking: string;
  deliveryStatusLabel: string;
  deliveryStatusTone: Tone;
  deliveryStatusKey: string;
  etaLabel: string;
  ticketsCount: number;
  createdAtLabel: string;
}

export interface OrdersView {
  mode: OrdersMode;
  meta: string;
  rows: OrderRowVM[];
  pipeline: { key: string; label: string; count: number; amount?: string }[];
  showAmounts: boolean;
}

const ACTIVE_STAGES = new Set<OrderStage>([
  "new",
  "awaiting_payment",
  "prepress",
  "print",
  "binding",
  "ready",
  "shipped",
]);

function ordersMode(account: DemoAccount): OrdersMode {
  if (account.role === "ceo") return "full";
  if (account.role === "sales") return "sales";
  if (account.role === "production") return "production";
  return "logistics";
}

function isOverdue(order: Order, now: Date): boolean {
  return (
    (order.stage === "prepress" ||
      order.stage === "print" ||
      order.stage === "binding") &&
    order.dueAt.getTime() < now.getTime()
  );
}

function dueToneFor(order: Order, now: Date): Tone | undefined {
  if (isOverdue(order, now)) return "error";
  const hoursLeft = (order.dueAt.getTime() - now.getTime()) / (60 * 60 * 1000);
  if (
    (order.stage === "prepress" || order.stage === "print" || order.stage === "binding") &&
    hoursLeft <= 24
  ) {
    return "warning";
  }
  return undefined;
}

export function getOrdersView(account: DemoAccount, now: Date = new Date()): OrdersView {
  const dataset = getDataset(now);
  const clientById = new Map(dataset.clients.map((client) => [client.id, client]));
  const productById = new Map(dataset.products.map((product) => [product.id, product]));
  const employeeById = new Map(dataset.employees.map((employee) => [employee.id, employee]));
  const shipmentById = new Map(dataset.shipments.map((shipment) => [shipment.id, shipment]));
  const from = periodStart(now, 90);
  const showMoney = canSeeOrderMoney(account.role);

  const rows = dataset.orders
    .filter(
      (order) =>
        order.createdAt.getTime() >= from.getTime() ||
        ACTIVE_STAGES.has(order.stage) ||
        (order.deliveredAt !== null && order.deliveredAt.getTime() >= from.getTime()),
    )
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .map((order) => {
      const client = clientById.get(order.clientId);
      const product = productById.get(order.productId);
      const shipment = order.shipmentId ? shipmentById.get(order.shipmentId) : null;
      const pickup = order.deliveryMethod === "pickup";
      const deliveryStatusKey = pickup
        ? "pickup"
        : shipment
          ? shipment.status
          : "none";
      const deliveryStatusLabel = pickup
        ? "Самовывоз"
        : shipment
          ? SHIPMENT_LABELS[shipment.status]
          : "Не передано";
      const deliveryStatusTone: Tone = pickup
        ? "neutral"
        : shipment
          ? shipmentTone(shipment.status)
          : "neutral";
      return {
        id: order.id,
        number: order.id,
        clientName: client?.name ?? "—",
        productName: product?.name ?? "—",
        quantity: order.quantity,
        amountLabel: showMoney ? formatMoney(order.amount) : null,
        paymentLabel: PAYMENT_LABELS[order.paymentStatus],
        paymentTone: paymentTone(order.paymentStatus),
        paymentKey: order.paymentStatus,
        stageLabel: ORDER_STAGE_LABELS[order.stage],
        stageTone: orderStageTone(order.stage),
        stageKey: order.stage,
        dueLabel: formatDateTime(order.dueAt),
        dueTone: dueToneFor(order, now),
        overdue: isOverdue(order, now),
        assigneeName: order.productionEmployeeId
          ? employeeById.get(order.productionEmployeeId)?.name ?? "—"
          : "—",
        managerName: employeeById.get(order.managerId)?.name ?? "—",
        deliveryLabel: pickup ? "Самовывоз" : shipment?.carrier ?? "—",
        tracking: shipment?.trackingNumber ?? "",
        deliveryStatusLabel,
        deliveryStatusTone,
        deliveryStatusKey,
        etaLabel: shipment ? formatDate(shipment.eta) : "—",
        ticketsCount: order.supportTicketIds.length,
        createdAtLabel: formatDateTime(order.createdAt),
      };
    });

  const mode = ordersMode(account);
  const pipelineKeys =
    mode === "full"
      ? ["order", "payment", "production", "ready", "delivery", "delivered"]
      : mode === "sales"
        ? ["order", "payment", "delivered"]
        : mode === "production"
          ? ["production", "ready"]
          : ["delivery", "delivered"];

  return {
    mode,
    meta: `Показаны заказы за 90 дней и все активные · ${formatNumber(rows.length)} записей · ${formatDateTime(now)}`,
    rows,
    showAmounts: showMoney,
    pipeline: orderPipeline(dataset.orders, now)
      .filter((bucket) => pipelineKeys.includes(bucket.key))
      .map((bucket) => ({
        key: bucket.key,
        label: bucket.label,
        count: bucket.count,
        amount: showMoney ? formatMoneyCompact(bucket.amount) : undefined,
      })),
  };
}

export interface OrderTimelineStep {
  key: string;
  label: string;
  dateLabel: string | null;
  state: "done" | "current" | "pending" | "error";
  note?: string;
}

export interface OrderDetailTicketVM {
  id: string;
  topic: string;
  statusLabel: string;
  statusTone: Tone;
  openedLabel: string;
  slaLabel: string;
  assigneeName: string;
  overdue: boolean;
  href: string | null;
}

export interface OrderDetailVM {
  id: string;
  number: string;
  createdAtLabel: string;
  clientName: string;
  clientSegment: string;
  productName: string;
  quantity: number;
  amountLabel: string | null;
  costLabel: string | null;
  marginLabel: string | null;
  marginPctLabel: string | null;
  paymentLabel: string;
  paymentTone: Tone;
  paidAtLabel: string | null;
  syncError: boolean;
  stageLabel: string;
  stageTone: Tone;
  dueLabel: string;
  overdue: boolean;
  deliveryMethodLabel: string;
  assigneeName: string;
  managerName: string;
  productionCompletedLabel: string | null;
  shipment: {
    carrier: string;
    tracking: string;
    statusLabel: string;
    statusTone: Tone;
    shippedAtLabel: string;
    etaLabel: string;
    deliveredAtLabel: string | null;
    delayReason: string;
    coordinatorName: string;
  } | null;
  tickets: OrderDetailTicketVM[];
  timeline: OrderTimelineStep[];
  canSeeMoney: boolean;
}

export function getOrderDetailView(
  account: DemoAccount,
  orderId: string,
  now: Date = new Date(),
): OrderDetailVM | null {
  const dataset = getDataset(now);
  const order = dataset.orders.find((item) => item.id === orderId);
  if (!order) return null;

  const client = dataset.clients.find((item) => item.id === order.clientId);
  const product = dataset.products.find((item) => item.id === order.productId);
  const employeeById = new Map(dataset.employees.map((employee) => [employee.id, employee]));
  const shipment: Shipment | null = order.shipmentId
    ? dataset.shipments.find((item) => item.id === order.shipmentId) ?? null
    : null;
  const canSeeMoney = canSeeOrderMoney(account.role);
  const margin = order.amount - order.cost;
  const pickup = order.deliveryMethod === "pickup";
  const productionStage =
    order.stage === "prepress" || order.stage === "print" || order.stage === "binding";
  const overdue = productionStage && order.dueAt.getTime() < now.getTime();

  const timeline: OrderTimelineStep[] = [
    {
      key: "created",
      label: "Заказ создан",
      dateLabel: formatDateTime(order.createdAt),
      state: "done",
    },
    {
      key: "payment",
      label: order.paymentStatus === "sync_error" ? "Оплата: ошибка синхронизации" : "Оплата",
      dateLabel:
        order.paymentStatus === "sync_error" && order.paidAt
          ? `${formatDateTime(order.paidAt)} · статус не передан в ERP/1С`
          : order.paidAt
            ? formatDateTime(order.paidAt)
            : "Ожидает оплаты",
      state:
        order.paymentStatus === "sync_error"
          ? "error"
          : order.paidAt
            ? "done"
            : "current",
      note:
        order.paymentStatus === "sync_error"
          ? "Повторить синхронизацию и проверить пречек."
          : undefined,
    },
    {
      key: "production",
      label:
        order.stage === "prepress" || order.stage === "print" || order.stage === "binding"
          ? `Производство: ${ORDER_STAGE_LABELS[order.stage].toLowerCase()}`
          : "Производство",
      dateLabel: order.productionCompletedAt
        ? formatDateTime(order.productionCompletedAt)
        : `Срок: ${formatDateTime(order.dueAt)}`,
      state: productionStage
        ? "current"
        : order.productionCompletedAt
          ? "done"
          : "pending",
    },
    {
      key: "ready",
      label: "Готов к передаче",
      dateLabel: order.productionCompletedAt
        ? formatDateTime(order.productionCompletedAt)
        : null,
      state:
        order.stage === "ready"
          ? "current"
          : order.productionCompletedAt
            ? "done"
            : "pending",
    },
    {
      key: "shipment",
      label: pickup ? "Самовывоз" : "Передан в доставку",
      dateLabel: shipment
        ? formatDateTime(shipment.shippedAt)
        : pickup && order.deliveredAt
          ? formatDateTime(order.deliveredAt)
          : null,
      state: order.stage === "shipped" ? "current" : order.deliveredAt ? "done" : "pending",
    },
    {
      key: "delivered",
      label: "Вручён клиенту",
      dateLabel: order.deliveredAt ? formatDateTime(order.deliveredAt) : null,
      state: order.deliveredAt ? "done" : "pending",
    },
  ];

  const tickets: OrderDetailTicketVM[] = order.supportTicketIds
    .map((ticketId) => dataset.tickets.find((ticket) => ticket.id === ticketId))
    .filter((ticket): ticket is SupportTicket => Boolean(ticket))
    .map((ticket) => {
      const isOverdue = ticket.status !== "closed" && ticket.slaDueAt.getTime() < now.getTime();
      return {
        id: ticket.id,
        topic: ticket.topic,
        statusLabel: TICKET_STATUS_LABELS[ticket.status],
        statusTone: ticketTone(ticket.status),
        openedLabel: formatDateTime(ticket.openedAt),
        slaLabel: formatDateTime(ticket.slaDueAt),
        assigneeName: employeeById.get(ticket.assigneeId)?.name ?? "—",
        overdue: isOverdue,
        href: canAccess(account.role, "service") ? "/service" : null,
      };
    });

  return {
    id: order.id,
    number: order.id,
    createdAtLabel: formatDateTime(order.createdAt),
    clientName: client?.name ?? "—",
    clientSegment: client?.segment ?? "—",
    productName: product?.name ?? "—",
    quantity: order.quantity,
    amountLabel: canSeeMoney ? formatMoney(order.amount) : null,
    costLabel: canSeeMoney ? formatMoney(order.cost) : null,
    marginLabel: canSeeMoney ? formatMoney(margin) : null,
    marginPctLabel: canSeeMoney && order.amount > 0 ? formatPercent(margin / order.amount, 1) : null,
    paymentLabel: PAYMENT_LABELS[order.paymentStatus],
    paymentTone: paymentTone(order.paymentStatus),
    paidAtLabel: order.paidAt ? formatDateTime(order.paidAt) : null,
    syncError: order.paymentStatus === "sync_error",
    stageLabel: ORDER_STAGE_LABELS[order.stage],
    stageTone: orderStageTone(order.stage),
    dueLabel: formatDateTime(order.dueAt),
    overdue,
    deliveryMethodLabel: pickup ? "Самовывоз" : "Доставка",
    assigneeName: order.productionEmployeeId
      ? employeeById.get(order.productionEmployeeId)?.name ?? "—"
      : "—",
    managerName: employeeById.get(order.managerId)?.name ?? "—",
    productionCompletedLabel: order.productionCompletedAt
      ? formatDateTime(order.productionCompletedAt)
      : null,
    shipment: shipment
      ? {
          carrier: shipment.carrier,
          tracking: shipment.trackingNumber,
          statusLabel: SHIPMENT_LABELS[shipment.status],
          statusTone: shipmentTone(shipment.status),
          shippedAtLabel: formatDateTime(shipment.shippedAt),
          etaLabel: formatDate(shipment.eta),
          deliveredAtLabel: shipment.deliveredAt
            ? formatDateTime(shipment.deliveredAt)
            : null,
          delayReason: shipment.delayReason ?? "—",
          coordinatorName: employeeById.get(shipment.coordinatorId)?.name ?? "—",
        }
      : null,
    tickets,
    timeline,
    canSeeMoney,
  };
}
