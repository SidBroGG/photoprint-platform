import type { Order, OrderStage, Shipment, SupportTicket } from "@/types/domain";
import { moscowDayIndex, moscowDate } from "@/lib/dates";

export const REVENUE_PAYMENT_STATUSES = new Set(["paid", "sync_error"]);

export function isRevenueOrder(order: Order): boolean {
  return REVENUE_PAYMENT_STATUSES.has(order.paymentStatus);
}

export function inRange(date: Date | null, from: Date, to: Date): boolean {
  if (!date) return false;
  const time = date.getTime();
  return time >= from.getTime() && time <= to.getTime();
}

export function periodStart(now: Date, days: number): Date {
  return moscowDate(moscowDayIndex(now) - days + 1, 0, 0);
}

export interface RevenueSummary {
  revenue: number;
  cost: number;
  margin: number;
  marginPct: number;
  orderCount: number;
  averageCheck: number;
}

export function revenueSummary(orders: Order[], from: Date, to: Date): RevenueSummary {
  const rows = orders.filter(
    (order) => isRevenueOrder(order) && inRange(order.paidAt, from, to),
  );
  const revenue = rows.reduce((sum, order) => sum + order.amount, 0);
  const cost = rows.reduce((sum, order) => sum + order.cost, 0);
  const margin = revenue - cost;
  return {
    revenue,
    cost,
    margin,
    marginPct: revenue > 0 ? margin / revenue : 0,
    orderCount: rows.length,
    averageCheck: rows.length > 0 ? revenue / rows.length : 0,
  };
}

export function revenueOf(orders: Order[], from: Date, to: Date): number {
  return orders
    .filter((order) => isRevenueOrder(order) && inRange(order.paidAt, from, to))
    .reduce((sum, order) => sum + order.amount, 0);
}

export function ordersCreatedBetween(orders: Order[], from: Date, to: Date): Order[] {
  return orders.filter((order) => inRange(order.createdAt, from, to));
}

export function countOrdersToday(orders: Order[], now: Date): number {
  const today = moscowDayIndex(now);
  return orders.filter((order) => moscowDayIndex(order.createdAt) === today).length;
}

export function activeProductionOrders(orders: Order[]): Order[] {
  return orders.filter(
    (order) =>
      order.stage === "prepress" || order.stage === "print" || order.stage === "binding",
  );
}

export function overdueProductionOrders(orders: Order[], now: Date): Order[] {
  return activeProductionOrders(orders).filter(
    (order) => order.dueAt.getTime() < now.getTime(),
  );
}

export function readyToShipOrders(orders: Order[]): Order[] {
  return orders.filter((order) => order.stage === "ready");
}

export function inDeliveryOrders(orders: Order[]): Order[] {
  return orders.filter((order) => order.stage === "shipped");
}

export function openTickets(tickets: SupportTicket[]): SupportTicket[] {
  return tickets.filter(
    (ticket) => ticket.status === "open" || ticket.status === "in_progress",
  );
}

export function overdueTickets(tickets: SupportTicket[], now: Date): SupportTicket[] {
  return openTickets(tickets).filter(
    (ticket) => ticket.slaDueAt.getTime() < now.getTime(),
  );
}

export function productionCompliance(orders: Order[], from: Date, to: Date): number {
  const completed = orders.filter(
    (order) =>
      order.productionCompletedAt !== null &&
      inRange(order.productionCompletedAt, from, to),
  );
  if (completed.length === 0) return 0;
  const onTime = completed.filter(
    (order) => order.productionCompletedAt!.getTime() <= order.dueAt.getTime(),
  );
  return onTime.length / completed.length;
}

export interface DeliveryStats {
  inTransit: number;
  deliveredLast30: number;
  overdue: number;
  onTimeRate: number;
}

export function deliveryStats(shipments: Shipment[], now: Date): DeliveryStats {
  const delivered = shipments.filter(
    (shipment) =>
      shipment.status === "delivered" &&
      shipment.deliveredAt !== null &&
      shipment.deliveredAt.getTime() >= periodStart(now, 30).getTime() &&
      shipment.deliveredAt.getTime() <= now.getTime(),
  );
  const onTime = delivered.filter(
    (shipment) => shipment.deliveredAt!.getTime() <= shipment.eta.getTime(),
  );
  const inTransit = shipments.filter(
    (shipment) => shipment.status !== "delivered" && shipment.deliveredAt === null,
  );
  const overdue = inTransit.filter((shipment) => shipment.eta.getTime() < now.getTime());
  return {
    inTransit: inTransit.length,
    deliveredLast30: delivered.length,
    overdue: overdue.length,
    onTimeRate: delivered.length > 0 ? onTime.length / delivered.length : 0,
  };
}

export interface ServiceStats {
  open: number;
  overdue: number;
  closedLast30: number;
  averageFirstResponseHours: number;
}

export function serviceStats(tickets: SupportTicket[], now: Date): ServiceStats {
  const from = periodStart(now, 30);
  const open = openTickets(tickets);
  const closed = tickets.filter(
    (ticket) =>
      ticket.status === "closed" &&
      ticket.closedAt !== null &&
      inRange(ticket.closedAt, from, now),
  );
  const responded = tickets.filter(
    (ticket) =>
      ticket.firstResponseAt !== null &&
      inRange(ticket.openedAt, from, now),
  );
  const totalResponseHours = responded.reduce(
    (sum, ticket) =>
      sum + (ticket.firstResponseAt!.getTime() - ticket.openedAt.getTime()) / (60 * 60 * 1000),
    0,
  );
  return {
    open: open.length,
    overdue: overdueTickets(tickets, now).length,
    closedLast30: closed.length,
    averageFirstResponseHours:
      responded.length > 0 ? totalResponseHours / responded.length : 0,
  };
}

export interface PipelineBucket {
  key: string;
  label: string;
  count: number;
  amount: number;
}

const PIPELINE_DEFINITION: { key: string; label: string; stages: OrderStage[] }[] = [
  { key: "order", label: "Заказ", stages: ["new"] },
  { key: "payment", label: "Оплата и синхронизация", stages: ["awaiting_payment"] },
  { key: "production", label: "Производство", stages: ["prepress", "print", "binding"] },
  { key: "ready", label: "Готов", stages: ["ready"] },
  { key: "delivery", label: "Доставка", stages: ["shipped"] },
  { key: "delivered", label: "Вручён (30 дней)", stages: ["delivered"] },
];

export function orderPipeline(orders: Order[], now: Date): PipelineBucket[] {
  const deliveredFrom = periodStart(now, 30);
  return PIPELINE_DEFINITION.map((bucket) => {
    const rows = orders.filter((order) => {
      if (!bucket.stages.includes(order.stage)) return false;
      if (order.stage === "delivered") {
        return order.deliveredAt !== null && order.deliveredAt.getTime() >= deliveredFrom.getTime();
      }
      return true;
    });
    return {
      key: bucket.key,
      label: bucket.label,
      count: rows.length,
      amount: rows.reduce((sum, order) => sum + order.amount, 0),
    };
  });
}
