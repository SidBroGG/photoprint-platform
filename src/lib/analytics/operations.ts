import type {
  Client,
  Dataset,
  Order,
  ProductionStage,
  Shipment,
  SupportTicket,
} from "@/types/domain";
import { PRODUCTION_STAGES, STAGE_CAPACITY } from "@/types/domain";
import {
  activeProductionOrders,
  deliveryStats,
  inRange,
  overdueProductionOrders,
  periodStart,
  productionCompliance,
  readyToShipOrders,
  serviceStats,
} from "@/lib/analytics/metrics";
import { addHours } from "@/lib/dates";
import { STAGE_LABELS } from "@/lib/labels";

export interface StageLoadRow {
  stage: ProductionStage;
  label: string;
  queue: number;
  capacity: number;
  loadPct: number;
  isBottleneck: boolean;
}

export function stageLoads(orders: Order[]): StageLoadRow[] {
  return PRODUCTION_STAGES.map((stage) => {
    const queue = orders.filter((order) => order.stage === stage).length;
    const capacity = STAGE_CAPACITY[stage];
    return {
      stage,
      label: STAGE_LABELS[stage],
      queue,
      capacity,
      loadPct: queue / capacity,
      isBottleneck: queue >= capacity,
    };
  });
}

export interface ProductionView {
  inProduction: number;
  overdue: number;
  ready: number;
  compliance: number;
  stages: StageLoadRow[];
  riskOrders: Order[];
}

export function productionView(orders: Order[], now: Date): ProductionView {
  const active = activeProductionOrders(orders);
  const overdue = overdueProductionOrders(orders, now);
  const ready = readyToShipOrders(orders);
  const risk = active
    .filter(
      (order) =>
        order.dueAt.getTime() < now.getTime() ||
        order.dueAt.getTime() <= addHours(now, 12).getTime(),
    )
    .sort((a, b) => a.dueAt.getTime() - b.dueAt.getTime());
  return {
    inProduction: active.length,
    overdue: overdue.length,
    ready: ready.length,
    compliance: productionCompliance(orders, periodStart(now, 30), now),
    stages: stageLoads(orders),
    riskOrders: risk,
  };
}

export interface ShipmentRow {
  order: Order;
  shipment: Shipment | null;
  client: Client;
}

export function shipmentRows(dataset: Dataset, now: Date): ShipmentRow[] {
  const orderById = new Map(dataset.orders.map((order) => [order.id, order]));
  const clientById = new Map(dataset.clients.map((client) => [client.id, client]));
  const rows: ShipmentRow[] = [];
  const deliveredFrom = periodStart(now, 14);

  for (const shipment of dataset.shipments) {
    const order = orderById.get(shipment.orderId);
    if (!order) continue;
    const client = clientById.get(order.clientId);
    if (!client) continue;
    const active = shipment.status !== "delivered";
    const recentlyDelivered =
      shipment.deliveredAt !== null &&
      shipment.deliveredAt.getTime() >= deliveredFrom.getTime() &&
      shipment.deliveredAt.getTime() <= now.getTime();
    if (!active && !recentlyDelivered) continue;
    rows.push({ order, shipment, client });
  }

  for (const order of dataset.orders) {
    if (order.deliveryMethod !== "pickup") continue;
    if (order.stage !== "ready" && order.stage !== "shipped") continue;
    const client = clientById.get(order.clientId);
    if (!client) continue;
    rows.push({ order, shipment: null, client });
  }

  return rows.sort((a, b) => {
    const aOverdue = isShipmentOverdue(a.shipment, now);
    const bOverdue = isShipmentOverdue(b.shipment, now);
    if (aOverdue !== bOverdue) return aOverdue ? -1 : 1;
    const aEta = a.shipment?.eta.getTime() ?? Number.MAX_SAFE_INTEGER;
    const bEta = b.shipment?.eta.getTime() ?? Number.MAX_SAFE_INTEGER;
    return aEta - bEta;
  });
}

export function isShipmentOverdue(shipment: Shipment | null, now: Date): boolean {
  if (!shipment || shipment.status === "delivered") return false;
  return shipment.eta.getTime() < now.getTime();
}

export interface ServiceView {
  open: number;
  overdue: number;
  closedLast30: number;
  averageFirstResponseHours: number;
  rows: SupportTicket[];
}

export function serviceView(dataset: Dataset, now: Date): ServiceView {
  const stats = serviceStats(dataset.tickets, now);
  const closedFrom = periodStart(now, 30);
  const rows = dataset.tickets
    .filter((ticket) => {
      if (ticket.status !== "closed") return true;
      return (
        ticket.closedAt !== null &&
        inRange(ticket.closedAt, closedFrom, now)
      );
    })
    .sort((a, b) => {
      const aOverdue = a.status !== "closed" && a.slaDueAt.getTime() < now.getTime();
      const bOverdue = b.status !== "closed" && b.slaDueAt.getTime() < now.getTime();
      if (aOverdue !== bOverdue) return aOverdue ? -1 : 1;
      return b.openedAt.getTime() - a.openedAt.getTime();
    });
  return { ...stats, rows };
}

export interface LogisticsView {
  inTransit: number;
  deliveredLast30: number;
  overdue: number;
  onTimeRate: number;
  rows: ShipmentRow[];
}

export function logisticsView(dataset: Dataset, now: Date): LogisticsView {
  const stats = deliveryStats(dataset.shipments, now);
  return {
    ...stats,
    rows: shipmentRows(dataset, now),
  };
}
