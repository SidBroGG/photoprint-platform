export type ClientSegment = "B2B" | "B2C";

export type PaymentStatus = "paid" | "pending" | "sync_error";

export type ProductionStage = "prepress" | "print" | "binding";

export type OrderStage =
  | "new"
  | "awaiting_payment"
  | "prepress"
  | "print"
  | "binding"
  | "ready"
  | "shipped"
  | "delivered";

export type ProductStatus = "active" | "discontinued";

export type ProductCategory = "photobooks" | "photoproducts";

export type ShipmentStatus = "in_transit" | "delayed" | "delivered";

export type TicketStatus = "open" | "in_progress" | "closed";

export type Department = "sales" | "production" | "logistics" | "service" | "marketing";

export type DeliveryMethod = "delivery" | "pickup";

export interface Client {
  id: string;
  name: string;
  segment: ClientSegment;
  createdAt: Date;
}

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  price: number;
  cost: number;
  status: ProductStatus;
}

export interface Employee {
  id: string;
  name: string;
  department: Department;
  role: string;
  stage?: ProductionStage;
  dailyNorm: number;
  active: boolean;
}

export interface Order {
  id: string;
  clientId: string;
  productId: string;
  quantity: number;
  amount: number;
  cost: number;
  createdAt: Date;
  paidAt: Date | null;
  paymentStatus: PaymentStatus;
  stage: OrderStage;
  dueAt: Date;
  productionCompletedAt: Date | null;
  deliveredAt: Date | null;
  productionEmployeeId: string | null;
  managerId: string;
  shipmentId: string | null;
  supportTicketIds: string[];
  deliveryMethod: DeliveryMethod;
}

export interface Shipment {
  id: string;
  orderId: string;
  carrier: string;
  trackingNumber: string;
  status: ShipmentStatus;
  shippedAt: Date;
  eta: Date;
  deliveredAt: Date | null;
  delayReason: string | null;
  coordinatorId: string;
}

export interface SupportTicket {
  id: string;
  orderId: string;
  clientId: string;
  topic: string;
  status: TicketStatus;
  openedAt: Date;
  firstResponseAt: Date | null;
  slaDueAt: Date;
  closedAt: Date | null;
  assigneeId: string;
}

export interface Dataset {
  generatedAt: Date;
  seed: number;
  clients: Client[];
  products: Product[];
  employees: Employee[];
  orders: Order[];
  shipments: Shipment[];
  tickets: SupportTicket[];
}

export const PRODUCTION_STAGES: ProductionStage[] = ["prepress", "print", "binding"];

export const STAGE_CAPACITY: Record<ProductionStage, number> = {
  prepress: 10,
  print: 8,
  binding: 6,
};

export const PRODUCTION_STAGE_SET = new Set<OrderStage>(["prepress", "print", "binding"]);
