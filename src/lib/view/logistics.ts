import { getDataset } from "@/lib/data/store";
import { isShipmentOverdue, logisticsView } from "@/lib/analytics/operations";
import { SHIPMENT_LABELS, shipmentTone, type Tone } from "@/lib/labels";
import { formatDate, formatDateTime, formatNumber, formatPercent } from "@/lib/format";
import type { KpiVM } from "@/lib/view/dashboard";

export interface LogisticsRowVM {
  id: string;
  orderId: string;
  number: string;
  clientName: string;
  carrier: string;
  tracking: string;
  shippedLabel: string;
  etaLabel: string;
  statusLabel: string;
  statusTone: Tone;
  delayReason: string;
  coordinatorName: string;
  pickup: boolean;
  overdue: boolean;
}

export interface LogisticsView {
  meta: string;
  kpis: KpiVM[];
  rows: LogisticsRowVM[];
}

export function getLogisticsView(now: Date = new Date()): LogisticsView {
  const dataset = getDataset(now);
  const view = logisticsView(dataset, now);
  const employeeById = new Map(dataset.employees.map((employee) => [employee.id, employee]));

  const rows: LogisticsRowVM[] = view.rows.map((row) => {
    const shipment = row.shipment;
    if (!shipment) {
      return {
        id: `pickup:${row.order.id}`,
        orderId: row.order.id,
        number: row.order.id,
        clientName: row.client.name,
        carrier: "Самовывоз",
        tracking: "—",
        shippedLabel: "—",
        etaLabel: "—",
        statusLabel: "Самовывоз",
        statusTone: "neutral",
        delayReason: "—",
        coordinatorName: "—",
        pickup: true,
        overdue: false,
      };
    }
    const overdue = isShipmentOverdue(shipment, now);
    return {
      id: shipment.id,
      orderId: row.order.id,
      number: row.order.id,
      clientName: row.client.name,
      carrier: shipment.carrier,
      tracking: shipment.trackingNumber,
      shippedLabel: formatDateTime(shipment.shippedAt),
      etaLabel: formatDate(shipment.eta),
      statusLabel: SHIPMENT_LABELS[shipment.status],
      statusTone: shipmentTone(shipment.status),
      delayReason:
        shipment.delayReason ?? (overdue ? "ETA прошла, вручения нет" : "—"),
      coordinatorName: employeeById.get(shipment.coordinatorId)?.name ?? "—",
      pickup: false,
      overdue,
    };
  });

  return {
    meta: `Активные отправления и доставленные за 14 дней · ${formatNumber(rows.length)} записей · ${formatDateTime(now)}`,
    kpis: [
      {
        label: "В пути",
        value: formatNumber(view.inTransit),
        hint: "Отправления без вручения",
      },
      {
        label: "Доставлено, 30 дней",
        value: formatNumber(view.deliveredLast30),
        hint: "По всем перевозчикам",
      },
      {
        label: "Просрочено",
        value: formatNumber(view.overdue),
        hint: "ETA прошла, вручения нет",
        tone: view.overdue > 0 ? "error" : "default",
      },
      {
        label: "Доставка в срок",
        value: formatPercent(view.onTimeRate, 0),
        hint: "Доставлено за 30 дней",
        tone: view.onTimeRate >= 0.9 ? "success" : "warning",
      },
    ],
    rows,
  };
}
