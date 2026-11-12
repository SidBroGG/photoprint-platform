import type {
  Department,
  OrderStage,
  PaymentStatus,
  ShipmentStatus,
  TicketStatus,
  ProductionStage,
} from "@/types/domain";

export const ORDER_STAGE_LABELS: Record<OrderStage, string> = {
  new: "Новый",
  awaiting_payment: "Ожидает оплаты",
  prepress: "Допечатная подготовка",
  print: "Печать",
  binding: "Сборка",
  ready: "Готов",
  shipped: "В пути",
  delivered: "Вручён",
};

export const STAGE_LABELS: Record<ProductionStage, string> = {
  prepress: "Допечатная подготовка",
  print: "Печать",
  binding: "Сборка",
};

export const PAYMENT_LABELS: Record<PaymentStatus, string> = {
  paid: "Оплачен",
  pending: "Ожидает оплаты",
  sync_error: "Ошибка синхронизации",
};

export const SHIPMENT_LABELS: Record<ShipmentStatus, string> = {
  in_transit: "В пути",
  delayed: "Задержка",
  delivered: "Доставлен",
};

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  open: "Открыто",
  in_progress: "В работе",
  closed: "Закрыто",
};

export const DEPARTMENT_LABELS: Record<Department, string> = {
  sales: "Продажи",
  production: "Производство",
  logistics: "Логистика",
  service: "Клиентский сервис",
  marketing: "Маркетинг",
};

export type Tone = "success" | "warning" | "error" | "info" | "neutral";

export function orderStageTone(stage: OrderStage): Tone {
  switch (stage) {
    case "new":
      return "info";
    case "awaiting_payment":
      return "warning";
    case "prepress":
    case "print":
    case "binding":
      return "info";
    case "ready":
      return "success";
    case "shipped":
      return "info";
    case "delivered":
      return "success";
  }
}

export function paymentTone(status: PaymentStatus): Tone {
  switch (status) {
    case "paid":
      return "success";
    case "pending":
      return "warning";
    case "sync_error":
      return "error";
  }
}

export function shipmentTone(status: ShipmentStatus): Tone {
  switch (status) {
    case "in_transit":
      return "info";
    case "delayed":
      return "error";
    case "delivered":
      return "success";
  }
}

export function ticketTone(status: TicketStatus): Tone {
  switch (status) {
    case "open":
      return "info";
    case "in_progress":
      return "warning";
    case "closed":
      return "success";
  }
}
