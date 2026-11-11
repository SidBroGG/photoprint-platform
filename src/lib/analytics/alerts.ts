import type { Dataset, Order } from "@/types/domain";
import { addHours, HOUR_MS } from "@/lib/dates";
import { buildCustomerAnalytics } from "@/lib/analytics/customers";
import { buildProductAnalytics } from "@/lib/analytics/products";
import { isShipmentOverdue, stageLoads } from "@/lib/analytics/operations";
import { buildForecast } from "@/lib/analytics/forecast";
import {
  overdueProductionOrders,
  overdueTickets,
  periodStart,
} from "@/lib/analytics/metrics";
import { STAGE_LABELS } from "@/lib/labels";

export type AlertDomain = "sales" | "production" | "logistics" | "service";
export type AlertSeverity = "critical" | "warning";

export interface Alert {
  id: string;
  type: string;
  severity: AlertSeverity;
  title: string;
  where: string;
  reason: string;
  action: string;
  owner: string;
  due: Date;
  href: string;
  domain: AlertDomain;
}

export function buildAlerts(dataset: Dataset, now: Date): Alert[] {
  const employeeById = new Map(dataset.employees.map((employee) => [employee.id, employee]));
  const orderById = new Map(dataset.orders.map((order) => [order.id, order]));
  const productionHead =
    dataset.employees.find((employee) => employee.role === "Руководитель производства")?.name ??
    "Руководитель производства";
  const salesHead =
    dataset.employees.find((employee) => employee.role === "Руководитель продаж и финансов")?.name ??
    "Руководитель продаж";
  const alerts: Alert[] = [];

  for (const order of dataset.orders) {
    if (order.paymentStatus !== "sync_error") continue;
    alerts.push({
      id: `payment_sync:${order.id}`,
      type: "payment_sync",
      severity: "critical",
      title: "Ошибка синхронизации оплаты",
      where: `Заказ ${order.id}`,
      reason: "Оплата получена, но статус не передан в ERP/1С.",
      action: "Повторить синхронизацию и проверить пречек.",
      owner: employeeById.get(order.managerId)?.name ?? salesHead,
      due: addHours(now, 4),
      href: `/orders/${order.id}`,
      domain: "sales",
    });
  }

  for (const order of overdueProductionOrders(dataset.orders, now)) {
    const overdueHours = Math.max(
      1,
      Math.round((now.getTime() - order.dueAt.getTime()) / HOUR_MS),
    );
    const stageLabel =
      order.stage === "prepress" || order.stage === "print" || order.stage === "binding"
        ? STAGE_LABELS[order.stage]
        : "Производство";
    alerts.push({
      id: `production_overdue:${order.id}`,
      type: "production_overdue",
      severity: overdueHours >= 12 ? "critical" : "warning",
      title: "Просрочка производства",
      where: `Заказ ${order.id} · ${stageLabel}`,
      reason: `Срок истёк ${overdueHours} ч назад: задержка на этапе.`,
      action: "Поднять приоритет и назначить ответственного.",
      owner:
        (order.productionEmployeeId
          ? employeeById.get(order.productionEmployeeId)?.name
          : null) ?? productionHead,
      due: addHours(now, 2),
      href: `/orders/${order.id}`,
      domain: "production",
    });
  }

  for (const stage of stageLoads(dataset.orders).filter((row) => row.isBottleneck)) {
    alerts.push({
      id: `production_bottleneck:${stage.stage}`,
      type: "production_bottleneck",
      severity: "warning",
      title: `Узкое место: ${stage.label.toLowerCase()}`,
      where: `Этап «${stage.label}»`,
      reason: `Очередь ${stage.queue} заказов при сменной мощности ${stage.capacity}.`,
      action: "Перераспределить смену и перенести неприоритетные заказы.",
      owner: productionHead,
      due: addHours(now, 6),
      href: "/production",
      domain: "production",
    });
  }

  for (const shipment of dataset.shipments) {
    const overdue = isShipmentOverdue(shipment, now);
    if (shipment.status !== "delayed" && !overdue) continue;
    const order = orderById.get(shipment.orderId);
    alerts.push({
      id: `delivery_delay:${shipment.id}`,
      type: "delivery_delay",
      severity: overdue ? "critical" : "warning",
      title: "Задержка доставки",
      where: `Отправление ${shipment.trackingNumber} · заказ ${shipment.orderId}`,
      reason: shipment.delayReason ?? "Расчётный срок доставки прошёл, вручения нет.",
      action: "Связаться с перевозчиком и уведомить клиента.",
      owner: employeeById.get(shipment.coordinatorId)?.name ?? "Координатор доставки",
      due: addHours(now, 3),
      href: order ? `/orders/${order.id}` : "/logistics",
      domain: "logistics",
    });
  }

  for (const ticket of overdueTickets(dataset.tickets, now)) {
    alerts.push({
      id: `sla_overdue:${ticket.id}`,
      type: "sla_overdue",
      severity: "critical",
      title: "Просрочка SLA",
      where: `Обращение ${ticket.id} · заказ ${ticket.orderId}`,
      reason: ticket.firstResponseAt
        ? "Просрочен ответ клиенту по регламенту SLA."
        : "Первого ответа нет, срок SLA истёк.",
      action: "Назначить исполнителя и ответить клиенту.",
      owner: employeeById.get(ticket.assigneeId)?.name ?? "Клиентский сервис",
      due: addHours(now, 2),
      href: "/service",
      domain: "service",
    });
  }

  const customerAnalytics = buildCustomerAnalytics(dataset, now);
  const last30From = periodStart(now, 30);
  const previous30From = periodStart(now, 60);
  for (const row of customerAnalytics.rows) {
    if (row.client.segment !== "B2B") continue;
    const lastOrderAt = row.lastOrderAt;
    if (lastOrderAt && lastOrderAt.getTime() >= last30From.getTime()) continue;
    const clientOrders = dataset.orders.filter(
      (order) =>
        order.clientId === row.client.id && (order.paymentStatus === "paid" || order.paymentStatus === "sync_error"),
    );
    const last30Revenue = clientOrders
      .filter(
        (order) =>
          order.paidAt !== null && order.paidAt.getTime() >= last30From.getTime(),
      )
      .reduce((sum, order) => sum + order.amount, 0);
    const previous30Revenue = clientOrders
      .filter(
        (order) =>
          order.paidAt !== null &&
          order.paidAt.getTime() >= previous30From.getTime() &&
          order.paidAt.getTime() < last30From.getTime(),
      )
      .reduce((sum, order) => sum + order.amount, 0);
    if (previous30Revenue <= 0 || last30Revenue > previous30Revenue * 0.5) continue;
    const drop = Math.round((1 - last30Revenue / previous30Revenue) * 100);
    const daysWithoutOrders = lastOrderAt
      ? Math.round((now.getTime() - lastOrderAt.getTime()) / (24 * HOUR_MS))
      : 999;
    const latestOrder: Order | undefined = dataset.orders
      .filter((order) => order.clientId === row.client.id)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
    alerts.push({
      id: `client_at_risk:${row.client.id}`,
      type: "client_at_risk",
      severity: "warning",
      title: "Клиент под риском",
      where: row.client.name,
      reason:
        daysWithoutOrders === 999
          ? `Оборот упал на ${drop}%, заказов нет более 30 дней.`
          : `Оборот упал на ${drop}%, заказов нет ${daysWithoutOrders} дн.`,
      action: "Связаться с клиентом и предложить повторный заказ.",
      owner: latestOrder
        ? employeeById.get(latestOrder.managerId)?.name ?? salesHead
        : salesHead,
      due: addHours(now, 24),
      href: "/customers",
      domain: "sales",
    });
  }

  const productAnalytics = buildProductAnalytics(dataset, now);
  for (const row of productAnalytics.rows) {
    if (row.product.status !== "active") continue;
    if (row.marginPct >= 0.25) continue;
    if (row.ordersLast30 <= 0) continue;
    alerts.push({
      id: `low_margin:${row.product.id}`,
      type: "low_margin",
      severity: "warning",
      title: "Низкая маржа продукта",
      where: row.product.name,
      reason: `Маржа ${Math.round(row.marginPct * 100)}% при ${row.ordersLast30} заказах за 30 дней.`,
      action: "Пересмотреть цену или себестоимость.",
      owner: salesHead,
      due: addHours(now, 24),
      href: "/products",
      domain: "sales",
    });
  }

  const forecast = buildForecast(dataset, now);
  for (const risk of forecast.risks) {
    alerts.push({
      id: risk.id,
      type: risk.domain === "production" ? "forecast_overload" : "forecast_sla",
      severity: risk.severity,
      title: risk.title,
      where:
        risk.domain === "production"
          ? "Прогноз спроса на производство"
          : "Прогноз по клиентскому сервису",
      reason: risk.reason,
      action: risk.action,
      owner: risk.domain === "production" ? productionHead : "Клиентский сервис",
      due: addHours(now, risk.severity === "critical" ? 24 : 48),
      href: "/forecast",
      domain: risk.domain,
    });
  }

  const domainOrder: Record<AlertDomain, number> = {
    sales: 0,
    production: 1,
    logistics: 2,
    service: 3,
  };
  return alerts.sort((a, b) => {
    if (a.severity !== b.severity) return a.severity === "critical" ? -1 : 1;
    if (a.due.getTime() !== b.due.getTime()) return a.due.getTime() - b.due.getTime();
    return domainOrder[a.domain] - domainOrder[b.domain];
  });
}
