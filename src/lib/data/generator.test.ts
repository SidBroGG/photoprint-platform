import { describe, expect, test } from "bun:test";
import { createDataset, DATA_SEED } from "./generator";
import { STAGE_CAPACITY } from "@/types/domain";
import type { OrderStage } from "@/types/domain";
import { addDays, addHours } from "@/lib/dates";

const NOW = new Date("2026-11-11T09:30:00Z");
const dataset = createDataset(NOW, DATA_SEED);

const ACTIVE_PRODUCTION_STAGES: OrderStage[] = ["prepress", "print", "binding"];

describe("createDataset", () => {
  test("is deterministic for the same seed and timestamp", () => {
    const second = createDataset(NOW, DATA_SEED);
    expect(second.orders.length).toBe(dataset.orders.length);
    expect(second.shipments.length).toBe(dataset.shipments.length);
    expect(second.tickets.length).toBe(dataset.tickets.length);
    expect(second.orders.map((order) => order.id)).toEqual(
      dataset.orders.map((order) => order.id),
    );
    expect(second.orders[0]?.createdAt.toISOString()).toBe(
      dataset.orders[0]?.createdAt.toISOString(),
    );
    expect(second.orders.at(-1)?.createdAt.toISOString()).toBe(
      dataset.orders.at(-1)?.createdAt.toISOString(),
    );
  });

  test("has the expected scale and shape", () => {
    expect(dataset.clients).toHaveLength(40);
    expect(dataset.products).toHaveLength(18);
    expect(dataset.employees).toHaveLength(18);
    expect(dataset.orders.length).toBeGreaterThan(2000);
    expect(dataset.orders.length).toBeLessThan(3500);
    expect(dataset.shipments.length).toBeGreaterThan(1000);
    expect(dataset.tickets.length).toBeGreaterThan(100);
  });

  test("keeps all references and statuses consistent", () => {
    const clientIds = new Set(dataset.clients.map((client) => client.id));
    const productIds = new Set(dataset.products.map((product) => product.id));
    const employeeIds = new Set(dataset.employees.map((employee) => employee.id));
    const orderById = new Map(dataset.orders.map((order) => [order.id, order]));
    const shipmentById = new Map(dataset.shipments.map((shipment) => [shipment.id, shipment]));
    const ticketIds = new Set(dataset.tickets.map((ticket) => ticket.id));

    for (const order of dataset.orders) {
      expect(clientIds.has(order.clientId)).toBe(true);
      expect(productIds.has(order.productId)).toBe(true);
      expect(employeeIds.has(order.managerId)).toBe(true);
      if (order.productionEmployeeId) {
        expect(employeeIds.has(order.productionEmployeeId)).toBe(true);
      }
      for (const ticketId of order.supportTicketIds) {
        expect(ticketIds.has(ticketId)).toBe(true);
      }
      if (order.shipmentId) {
        const shipment = shipmentById.get(order.shipmentId);
        expect(shipment).toBeDefined();
        expect(shipment?.orderId).toBe(order.id);
      }
      if (order.deliveryMethod === "delivery" && (order.stage === "shipped" || order.stage === "delivered")) {
        expect(order.shipmentId).not.toBeNull();
      }
      if (order.deliveryMethod === "pickup") {
        expect(order.shipmentId).toBeNull();
      }
      if (order.paymentStatus === "pending") {
        expect(order.paidAt).toBeNull();
      } else {
        expect(order.paidAt).not.toBeNull();
      }
      if (order.stage === "delivered") {
        expect(order.deliveredAt).not.toBeNull();
      }
      if (order.stage === "shipped" && order.deliveryMethod === "delivery") {
        const shipment = order.shipmentId ? shipmentById.get(order.shipmentId) : null;
        expect(shipment?.status === "in_transit" || shipment?.status === "delayed").toBe(true);
      }
    }

    for (const ticket of dataset.tickets) {
      const order = orderById.get(ticket.orderId);
      expect(order).toBeDefined();
      expect(order?.clientId).toBe(ticket.clientId);
      expect(employeeIds.has(ticket.assigneeId)).toBe(true);
      if (ticket.status === "closed") {
        expect(ticket.closedAt).not.toBeNull();
        expect(ticket.firstResponseAt).not.toBeNull();
      }
    }
  });

  test("contains every guaranteed demo situation", () => {
    const syncErrors = dataset.orders.filter((order) => order.paymentStatus === "sync_error");
    expect(syncErrors.length).toBeGreaterThanOrEqual(2);

    const overdueProduction = dataset.orders.filter(
      (order) =>
        ACTIVE_PRODUCTION_STAGES.includes(order.stage) && order.dueAt.getTime() < NOW.getTime(),
    );
    expect(overdueProduction.length).toBeGreaterThanOrEqual(3);

    const bindingQueue = dataset.orders.filter((order) => order.stage === "binding");
    expect(bindingQueue.length).toBeGreaterThanOrEqual(STAGE_CAPACITY.binding);

    const awaitingPayment = dataset.orders.filter(
      (order) => order.stage === "awaiting_payment",
    );
    expect(awaitingPayment.length).toBeGreaterThanOrEqual(2);
    expect(awaitingPayment.every((order) => order.paymentStatus === "pending")).toBe(true);

    const delayedShipments = dataset.shipments.filter((shipment) => shipment.status === "delayed");
    expect(delayedShipments.length).toBeGreaterThanOrEqual(3);

    const overdueTickets = dataset.tickets.filter(
      (ticket) =>
        (ticket.status === "open" || ticket.status === "in_progress") &&
        ticket.slaDueAt.getTime() < NOW.getTime(),
    );
    expect(overdueTickets.length).toBeGreaterThanOrEqual(3);

    const repeatClients = new Set<string>();
    const seenClients = new Set<string>();
    for (const order of dataset.orders) {
      if (seenClients.has(order.clientId)) repeatClients.add(order.clientId);
      seenClients.add(order.clientId);
    }
    expect(repeatClients.size).toBeGreaterThan(20);
  });

  test("keeps discontinued and low-margin demo cases", () => {
    for (const productId of ["p10", "p18"]) {
      const product = dataset.products.find((item) => item.id === productId);
      expect(product?.status).toBe("discontinued");
      const lastOrder = dataset.orders
        .filter((order) => order.productId === productId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
      expect(lastOrder).toBeDefined();
      expect(lastOrder!.createdAt.getTime()).toBeLessThan(addDays(NOW, -60).getTime());
    }

    const lowMargin = dataset.products.find((product) => product.id === "p11");
    expect(lowMargin).toBeDefined();
    expect((lowMargin!.price - lowMargin!.cost) / lowMargin!.price).toBeLessThan(0.25);
    const recentLowMarginOrders = dataset.orders.filter(
      (order) =>
        order.productId === "p11" &&
        order.paymentStatus === "paid" &&
        order.paidAt !== null &&
        order.paidAt.getTime() >= addDays(NOW, -30).getTime(),
    );
    expect(recentLowMarginOrders.length).toBeGreaterThan(0);
  });

  test("keeps two B2B clients at risk with a prior revenue base", () => {
    const atRisk = dataset.clients.filter((client) => ["c03", "c07"].includes(client.id));
    expect(atRisk).toHaveLength(2);
    for (const client of atRisk) {
      expect(client.segment).toBe("B2B");
      const clientOrders = dataset.orders.filter((order) => order.clientId === client.id);
      const lastOrder = clientOrders.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
      )[0];
      expect(lastOrder).toBeDefined();
      expect(lastOrder!.createdAt.getTime()).toBeLessThan(addDays(NOW, -30).getTime());

      const previousWindowRevenue = clientOrders
        .filter(
          (order) =>
            order.paidAt !== null &&
            order.paidAt.getTime() >= addDays(NOW, -60).getTime() &&
            order.paidAt.getTime() < addDays(NOW, -30).getTime(),
        )
        .reduce((sum, order) => sum + order.amount, 0);
      expect(previousWindowRevenue).toBeGreaterThan(0);
    }
  });

  test("produces production completions around the one-day SLA", () => {
    const completed = dataset.orders.filter(
      (order) =>
        order.productionCompletedAt !== null &&
        order.productionCompletedAt.getTime() >= addDays(NOW, -30).getTime(),
    );
    expect(completed.length).toBeGreaterThan(100);
    const onTime = completed.filter(
      (order) => order.productionCompletedAt!.getTime() <= order.dueAt.getTime(),
    );
    const share = onTime.length / completed.length;
    expect(share).toBeGreaterThan(0.75);
    expect(share).toBeLessThan(0.99);
  });

  test("includes active shipments with a future ETA", () => {
    const activeShipments = dataset.shipments.filter(
      (shipment) =>
        shipment.status === "in_transit" &&
        shipment.eta.getTime() > NOW.getTime() &&
        shipment.shippedAt.getTime() < addHours(NOW, 1).getTime(),
    );
    expect(activeShipments.length).toBeGreaterThan(5);
  });
});
