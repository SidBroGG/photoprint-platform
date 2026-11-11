import type {
  Client,
  Dataset,
  DeliveryMethod,
  Department,
  Employee,
  Order,
  OrderStage,
  PaymentStatus,
  Product,
  ProductionStage,
  Shipment,
  SupportTicket,
} from "@/types/domain";
import { PRODUCTION_STAGES } from "@/types/domain";
import {
  addDays,
  addHours,
  addMinutes,
  moscowDate,
  moscowDayIndex,
  monthKey,
  weekdayIndex,
} from "@/lib/dates";

export const DATA_SEED = 20261111;
export const HISTORY_DAYS = 365;

const AT_RISK_CLIENT_IDS = new Set(["c03", "c07"]);

const B2B_NAMES = [
  "ООО «Альбом-Студия»",
  "ООО «Свадебный альбом»",
  "ООО «Полиграф-Центр»",
  "ООО «ФотоМир»",
  "ООО «Книга семьи»",
  "ООО «Календарь Плюс»",
  "ООО «Студия Кадр»",
  "ООО «Медиа-Печать»",
  "ООО «Юбилей»",
  "ООО «Фотолетопись»",
  "ООО «Арт-Фото»",
  "ООО «Моменты»",
];

const B2C_NAMES = [
  "Анна Ковалёва",
  "Сергей Иванов",
  "Мария Соколова",
  "Дмитрий Попов",
  "Елена Лебедева",
  "Андрей Новиков",
  "Ольга Морозова",
  "Павел Волков",
  "Татьяна Павлова",
  "Алексей Семёнов",
  "Ирина Голубева",
  "Михаил Виноградов",
  "Наталья Богданова",
  "Артём Воробьёв",
  "Екатерина Фёдорова",
  "Илья Михайлов",
  "Светлана Беляева",
  "Роман Тарасов",
  "Юлия Комарова",
  "Виктор Орлов",
  "Дарья Киселёва",
  "Никита Макаров",
  "Полина Андреева",
  "Максим Козлов",
  "Валентина Степанова",
  "Григорий Никитин",
  "Алина Соловьёва",
  "Денис Кузьмин",
];

interface ProductSeed {
  name: string;
  category: Product["category"];
  price: number;
  cost: number;
  status: Product["status"];
}

const PRODUCT_SEEDS: ProductSeed[] = [
  { name: "Классическая фотокнига 20×20", category: "photobooks", price: 3900, cost: 2200, status: "active" },
  { name: "Премиум-фотокнига 30×30", category: "photobooks", price: 7900, cost: 4200, status: "active" },
  { name: "Мини-фотокнига 15×15", category: "photobooks", price: 2400, cost: 1400, status: "active" },
  { name: "Фотокнига «Свадебная»", category: "photobooks", price: 8900, cost: 5000, status: "active" },
  { name: "Фотокнига «Выпускная»", category: "photobooks", price: 5600, cost: 3100, status: "active" },
  { name: "Фотокнига «Календарь года»", category: "photobooks", price: 4200, cost: 2500, status: "active" },
  { name: "Фотокнига «Путешествие»", category: "photobooks", price: 4800, cost: 2800, status: "active" },
  { name: "Фотокнига «Детская»", category: "photobooks", price: 3600, cost: 2100, status: "active" },
  { name: "Фотокнига «Юбилейная»", category: "photobooks", price: 6800, cost: 3900, status: "active" },
  { name: "Фотокнига «Люкс»", category: "photobooks", price: 12900, cost: 7300, status: "discontinued" },
  { name: "Фотопринт A4", category: "photoproducts", price: 450, cost: 380, status: "active" },
  { name: "Фотопринт A3", category: "photoproducts", price: 900, cost: 380, status: "active" },
  { name: "Холст 40×60", category: "photoproducts", price: 3200, cost: 1700, status: "active" },
  { name: "Пазл фотографический", category: "photoproducts", price: 1500, cost: 700, status: "active" },
  { name: "Кружка с фото", category: "photoproducts", price: 950, cost: 420, status: "active" },
  { name: "Календарь настенный", category: "photoproducts", price: 1100, cost: 480, status: "active" },
  { name: "Фотопанно 60×90", category: "photoproducts", price: 5600, cost: 3100, status: "active" },
  { name: "Открытки (набор 10 шт.)", category: "photoproducts", price: 700, cost: 300, status: "discontinued" },
];

interface EmployeeSeed {
  name: string;
  department: Department;
  role: string;
  stage?: ProductionStage;
  dailyNorm: number;
}

const EMPLOYEE_SEEDS: EmployeeSeed[] = [
  { name: "Игорь Волков", department: "sales", role: "Руководитель продаж и финансов", dailyNorm: 14 },
  { name: "Светлана Белова", department: "sales", role: "Менеджер по продажам", dailyNorm: 10 },
  { name: "Павел Гусев", department: "sales", role: "Менеджер по продажам", dailyNorm: 10 },
  { name: "Елена Титова", department: "sales", role: "Финансовый контролёр", dailyNorm: 8 },
  { name: "Мария Кузнецова", department: "production", role: "Руководитель производства", dailyNorm: 12 },
  { name: "Сергей Крылов", department: "production", role: "Специалист допечатной подготовки", stage: "prepress", dailyNorm: 8 },
  { name: "Ольга Никитина", department: "production", role: "Специалист допечатной подготовки", stage: "prepress", dailyNorm: 8 },
  { name: "Алексей Петров", department: "production", role: "Оператор печати", stage: "print", dailyNorm: 7 },
  { name: "Дмитрий Соколов", department: "production", role: "Оператор печати", stage: "print", dailyNorm: 7 },
  { name: "Ирина Фёдорова", department: "production", role: "Оператор печати", stage: "print", dailyNorm: 7 },
  { name: "Наталья Зайцева", department: "production", role: "Специалист сборки", stage: "binding", dailyNorm: 6 },
  { name: "Артём Лебедев", department: "production", role: "Специалист сборки", stage: "binding", dailyNorm: 6 },
  { name: "Юлия Смирнова", department: "production", role: "Специалист сборки", stage: "binding", dailyNorm: 6 },
  { name: "Дмитрий Орлов", department: "logistics", role: "Руководитель логистики и клиентского сервиса", dailyNorm: 12 },
  { name: "Оксана Волкова", department: "logistics", role: "Координатор доставки", dailyNorm: 8 },
  { name: "Роман Кузьмин", department: "logistics", role: "Координатор доставки", dailyNorm: 8 },
  { name: "Ольга Соколова", department: "service", role: "Специалист клиентского сервиса", dailyNorm: 5 },
  { name: "Виктор Павлов", department: "service", role: "Специалист клиентского сервиса", dailyNorm: 7 },
];

const MONTH_SEASON = [0.95, 0.9, 1.0, 1.2, 1.3, 1.25, 1.12, 1.18, 1.12, 1.0, 1.22, 1.3];
const WEEKDAY_FACTOR = [1.08, 1.08, 1.04, 1.04, 1.0, 0.82, 0.74];

const CARRIERS = [
  { name: "СДЭК", prefix: "SDEK" },
  { name: "Boxberry", prefix: "BOX" },
  { name: "Почта России", prefix: "POST" },
  { name: "Курьер", prefix: "CR" },
];

const TICKET_TOPICS = [
  "Уточнение макета",
  "Срок изготовления",
  "Проверка оплаты",
  "Задержка доставки",
  "Пожелания по сборке",
  "Изменение адреса",
  "Повреждение упаковки",
  "Повторный заказ",
];

const DELAY_REASONS = [
  "Перевозчик задержал передачу груза",
  "Курьер не смог найти адрес",
  "Сбой сортировочного центра",
];

class Rng {
  private readonly source: () => number;

  constructor(seed: number) {
    this.source = mulberry32(seed);
  }

  next(): number {
    return this.source();
  }

  int(min: number, max: number): number {
    return min + Math.floor(this.source() * (max - min + 1));
  }

  chance(probability: number): boolean {
    return this.source() < probability;
  }

  pick<T>(items: readonly T[]): T {
    return items[Math.floor(this.source() * items.length)] as T;
  }

  weighted<T>(items: readonly { value: T; weight: number }[]): T {
    const total = items.reduce((sum, item) => sum + item.weight, 0);
    let roll = this.source() * total;
    for (const item of items) {
      roll -= item.weight;
      if (roll <= 0) return item.value;
    }
    return items[items.length - 1]!.value;
  }
}

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pad(value: number, length = 2): string {
  return String(value).padStart(length, "0");
}

function buildClients(now: Date): Client[] {
  const clients: Client[] = [];
  B2B_NAMES.forEach((name, index) => {
    clients.push({
      id: `c${pad(index + 1)}`,
      name,
      segment: "B2B",
      createdAt: addDays(now, -(560 + index * 23)),
    });
  });
  B2C_NAMES.forEach((name, index) => {
    clients.push({
      id: `c${pad(B2B_NAMES.length + index + 1)}`,
      name,
      segment: "B2C",
      createdAt: addDays(now, -(40 + index * 19)),
    });
  });
  return clients;
}

function buildProducts(): Product[] {
  return PRODUCT_SEEDS.map((seed, index) => ({
    id: `p${pad(index + 1)}`,
    name: seed.name,
    category: seed.category,
    price: seed.price,
    cost: seed.cost,
    status: seed.status,
  }));
}

function buildEmployees(): Employee[] {
  return EMPLOYEE_SEEDS.map((seed, index) => ({
    id: `e${pad(index + 1)}`,
    name: seed.name,
    department: seed.department,
    role: seed.role,
    stage: seed.stage,
    dailyNorm: seed.dailyNorm,
    active: true,
  }));
}

export function createDataset(now: Date = new Date(), seed: number = DATA_SEED): Dataset {
  const rng = new Rng(seed);
  const clients = buildClients(now);
  const products = buildProducts();
  const employees = buildEmployees();
  const todayIndex = moscowDayIndex(now);

  const employeesByStage: Record<ProductionStage, Employee[]> = {
    prepress: employees.filter((employee) => employee.stage === "prepress"),
    print: employees.filter((employee) => employee.stage === "print"),
    binding: employees.filter((employee) => employee.stage === "binding"),
  };
  const salesEmployees = employees.filter((employee) => employee.department === "sales");
  const serviceEmployees = employees.filter((employee) => employee.department === "service");
  const coordinators = employees.filter((employee) => employee.department === "logistics" && employee.role.includes("Координатор"));
  const activeProducts = products.filter((product) => product.status === "active");
  const safeClients = clients.filter((client) => !AT_RISK_CLIENT_IDS.has(client.id));

  const orders: Order[] = [];
  const shipments: Shipment[] = [];
  const tickets: SupportTicket[] = [];
  let orderCounter = 0;
  let shipmentCounter = 0;
  let ticketCounter = 0;

  function nextOrderId(): string {
    orderCounter += 1;
    return `PP-${100000 + orderCounter}`;
  }

  function productionEmployeeFor(stage: ProductionStage): string {
    return rng.pick(employeesByStage[stage]).id;
  }

  function pickClient(dayIndex: number): Client {
    const available = clients.filter((client) => {
      if (moscowDayIndex(client.createdAt) > dayIndex) return false;
      if (AT_RISK_CLIENT_IDS.has(client.id) && dayIndex > todayIndex - 31) return false;
      return true;
    });
    return rng.weighted(
      available.map((client) => ({
        value: client,
        weight: client.segment === "B2B" ? 4 : 1.2,
      })),
    );
  }

  function pickProduct(dayIndex: number): Product {
    const available = products.filter(
      (product) => product.status === "active" || dayIndex <= todayIndex - 61,
    );
    return rng.weighted(
      available.map((product) => ({
        value: product,
        weight:
          product.id === "p11"
            ? 9
            : product.category === "photobooks"
              ? 10
              : 5,
      })),
    );
  }

  function pickSalesManager(): string {
    return rng.weighted(
      salesEmployees.map((employee, index) => ({
        value: employee.id,
        weight: index === 0 ? 3 : 2,
      })),
    );
  }

  function createOrder(input: {
    client: Client;
    product: Product;
    quantity: number;
    createdAt: Date;
    paymentStatus: PaymentStatus;
    paidAt: Date | null;
    stage: OrderStage;
    dueAt: Date;
    productionCompletedAt: Date | null;
    productionEmployeeId: string | null;
    deliveryMethod: DeliveryMethod;
  }): Order {
    const discount = input.client.segment === "B2B" ? 0.95 : 1;
    const amount = Math.round((input.product.price * input.quantity * discount) / 10) * 10;
    const cost = input.product.cost * input.quantity;
    const order: Order = {
      id: nextOrderId(),
      clientId: input.client.id,
      productId: input.product.id,
      quantity: input.quantity,
      amount,
      cost,
      createdAt: input.createdAt,
      paidAt: input.paidAt,
      paymentStatus: input.paymentStatus,
      stage: input.stage,
      dueAt: input.dueAt,
      productionCompletedAt: input.productionCompletedAt,
      deliveredAt: null,
      productionEmployeeId: input.productionEmployeeId,
      managerId: pickSalesManager(),
      shipmentId: null,
      supportTicketIds: [],
      deliveryMethod: input.deliveryMethod,
    };
    orders.push(order);
    return order;
  }

  function createShipment(input: {
    order: Order;
    status: Shipment["status"];
    shippedAt: Date;
    eta: Date;
    deliveredAt: Date | null;
    delayReason: string | null;
  }): Shipment {
    shipmentCounter += 1;
    const carrier = rng.pick(CARRIERS);
    const shipment: Shipment = {
      id: `sh-${pad(shipmentCounter, 4)}`,
      orderId: input.order.id,
      carrier: carrier.name,
      trackingNumber: `${carrier.prefix}-${rng.int(10000000, 99999999)}`,
      status: input.status,
      shippedAt: input.shippedAt,
      eta: input.eta,
      deliveredAt: input.deliveredAt,
      delayReason: input.delayReason,
      coordinatorId: rng.pick(coordinators).id,
    };
    shipments.push(shipment);
    input.order.shipmentId = shipment.id;
    return shipment;
  }

  function quantityFor(client: Client): number {
    return rng.weighted([
      { value: 1, weight: client.segment === "B2B" ? 62 : 82 },
      { value: 2, weight: client.segment === "B2B" ? 26 : 14 },
      { value: 3, weight: 8 },
      { value: 4, weight: 4 },
    ]);
  }

  function createDeliveredOrder(dayIndex: number): Order {
    const client = pickClient(dayIndex);
    const product = pickProduct(dayIndex);
    const quantity = quantityFor(client);
    const createdAt = moscowDate(dayIndex, rng.int(9, 18), rng.int(0, 59));
    const paidAt = addMinutes(createdAt, rng.int(25, 240));
    const dueAt = moscowDate(dayIndex + 1, 18, 0);
    const lateProduction = rng.chance(0.12);
    const productionCompletedAt = lateProduction
      ? addMinutes(dueAt, rng.int(120, 600))
      : addMinutes(dueAt, -rng.int(60, 480));
    const deliveryMethod: DeliveryMethod = rng.chance(0.2) ? "pickup" : "delivery";
    const order = createOrder({
      client,
      product,
      quantity,
      createdAt,
      paymentStatus: "paid",
      paidAt,
      stage: "delivered",
      dueAt,
      productionCompletedAt,
      productionEmployeeId: productionEmployeeFor("binding"),
      deliveryMethod,
    });

    let deliveredAt: Date;
    if (deliveryMethod === "pickup") {
      deliveredAt = addMinutes(productionCompletedAt, rng.int(60, 360));
    } else {
      const shippedAt = addMinutes(productionCompletedAt, rng.int(90, 300));
      const lateDelivery = rng.chance(0.1);
      const eta = addMinutes(shippedAt, rng.int(1440, 2880));
      deliveredAt = lateDelivery
        ? addMinutes(eta, rng.int(360, 1800))
        : addMinutes(eta, -rng.int(60, 600));
      let adjustedEta = eta;
      const latestAllowed = addMinutes(now, -20);
      if (deliveredAt.getTime() > latestAllowed.getTime()) {
        deliveredAt = latestAllowed;
        adjustedEta = lateDelivery
          ? addMinutes(deliveredAt, -180)
          : addMinutes(deliveredAt, 180);
      }
      createShipment({
        order,
        status: "delivered",
        shippedAt,
        eta: adjustedEta,
        deliveredAt,
        delayReason: null,
      });
    }
    order.deliveredAt = deliveredAt;
    return order;
  }

  function recentStage(daysAgo: number): OrderStage {
    if (daysAgo >= 4) return "shipped";
    if (daysAgo === 3) return rng.chance(0.5) ? "shipped" : "ready";
    if (daysAgo === 2) return rng.chance(0.6) ? "ready" : "shipped";
    if (daysAgo === 1) {
      return rng.weighted<OrderStage>([
        { value: "prepress", weight: 10 },
        { value: "print", weight: 30 },
        { value: "binding", weight: 60 },
      ]);
    }
    return rng.weighted<OrderStage>([
      { value: "new", weight: 25 },
      { value: "awaiting_payment", weight: 15 },
      { value: "prepress", weight: 35 },
      { value: "print", weight: 25 },
    ]);
  }

  function createRecentOrder(dayIndex: number): Order {
    const client = pickClient(dayIndex);
    const product = pickProduct(dayIndex);
    const quantity = quantityFor(client);
    const daysAgo = todayIndex - dayIndex;
    const stage = recentStage(daysAgo);
    let createdAt = moscowDate(dayIndex, rng.int(9, 18), rng.int(0, 59));
    if (createdAt.getTime() > now.getTime() - 10 * 60 * 1000) {
      createdAt = addMinutes(now, -rng.int(20, 150));
    }
    const dueAt = moscowDate(dayIndex + 1, 18, 0);
    const deliveryMethod: DeliveryMethod = rng.chance(0.2) ? "pickup" : "delivery";
    const awaitingPayment = stage === "new" || stage === "awaiting_payment";
    const paymentStatus: PaymentStatus = awaitingPayment ? "pending" : "paid";
    let paidAt: Date | null = null;
    if (!awaitingPayment) {
      paidAt = addMinutes(createdAt, rng.int(20, 150));
      if (paidAt.getTime() > now.getTime()) paidAt = addMinutes(now, -rng.int(5, 30));
    }
    let productionEmployeeId: string | null = null;
    if (PRODUCTION_STAGES.includes(stage as ProductionStage)) {
      productionEmployeeId = productionEmployeeFor(stage as ProductionStage);
    } else if (stage === "ready" || stage === "shipped") {
      productionEmployeeId = productionEmployeeFor("binding");
    }
    let productionCompletedAt: Date | null = null;
    if (stage === "ready" || stage === "shipped") {
      productionCompletedAt = addMinutes(dueAt, -rng.int(60, 240));
    }
    const order = createOrder({
      client,
      product,
      quantity,
      createdAt,
      paymentStatus,
      paidAt,
      stage,
      dueAt,
      productionCompletedAt,
      productionEmployeeId,
      deliveryMethod,
    });
    if (stage === "shipped" && productionCompletedAt && deliveryMethod === "delivery") {
      createShipment({
        order,
        status: "in_transit",
        shippedAt: addMinutes(productionCompletedAt, rng.int(120, 360)),
        eta: addMinutes(now, rng.int(24, 60)),
        deliveredAt: null,
        delayReason: null,
      });
    }
    return order;
  }

  // 1. History: delivered orders for the last year.
  for (let offset = -HISTORY_DAYS; offset <= -5; offset += 1) {
    const dayIndex = todayIndex + offset;
    const date = moscowDate(dayIndex, 12);
    const month = Number(monthKey(date).slice(5, 7));
    const season = MONTH_SEASON[month - 1] ?? 1;
    const weekday = WEEKDAY_FACTOR[weekdayIndex(date)] ?? 1;
    const noise = 0.75 + rng.next() * 0.5;
    const count = Math.max(3, Math.round(6.5 * season * weekday * noise));
    for (let i = 0; i < count; i += 1) {
      createDeliveredOrder(dayIndex);
    }
  }

  // 2. Recent pipeline: orders from the last five days.
  for (let offset = -4; offset <= 0; offset += 1) {
    const dayIndex = todayIndex + offset;
    const date = moscowDate(dayIndex, 12);
    const weekday = WEEKDAY_FACTOR[weekdayIndex(date)] ?? 1;
    const count = Math.max(4, Math.round(6.5 * weekday * (0.9 + rng.next() * 0.2)));
    for (let i = 0; i < count; i += 1) {
      createRecentOrder(dayIndex);
    }
  }

  // 3. Clients at risk: solid turnover in the previous 30-day window, no orders in the last 30 days.
  const atRiskClients = clients.filter((client) => AT_RISK_CLIENT_IDS.has(client.id));
  atRiskClients.forEach((client, clientIndex) => {
    [-50, -44, -38].forEach((offset, orderIndex) => {
      const dayIndex = todayIndex + offset;
      const product = products[(clientIndex * 3 + orderIndex) % 9] ?? products[0]!;
      const createdAt = moscowDate(dayIndex, 11, rng.int(0, 59));
      const dueAt = moscowDate(dayIndex + 1, 18, 0);
      const order = createOrder({
        client,
        product: product!,
        quantity: 2,
        createdAt,
        paymentStatus: "paid",
        paidAt: addHours(createdAt, 2),
        stage: "delivered",
        dueAt,
        productionCompletedAt: addMinutes(dueAt, -120),
        productionEmployeeId: productionEmployeeFor("binding"),
        deliveryMethod: "delivery",
      });
      const shippedAt = addHours(order.productionCompletedAt!, 4);
      const eta = addHours(shippedAt, 30);
      const deliveredAt = addHours(eta, 2);
      createShipment({
        order,
        status: "delivered",
        shippedAt,
        eta,
        deliveredAt,
        delayReason: null,
      });
      order.deliveredAt = deliveredAt;
    });
  });

  // 4. Guaranteed low-margin product sales in the last 30 days.
  [-8, -12].forEach((offset) => {
    const dayIndex = todayIndex + offset;
    const client = safeClients[2] ?? safeClients[0]!;
    const product = products.find((item) => item.id === "p11")!;
    const createdAt = moscowDate(dayIndex, 12, rng.int(0, 59));
    const dueAt = moscowDate(dayIndex + 1, 18, 0);
    const order = createOrder({
      client,
      product,
      quantity: 3,
      createdAt,
      paymentStatus: "paid",
      paidAt: addHours(createdAt, 1),
      stage: "delivered",
      dueAt,
      productionCompletedAt: addMinutes(dueAt, -180),
      productionEmployeeId: productionEmployeeFor("binding"),
      deliveryMethod: "pickup",
    });
    order.deliveredAt = addMinutes(order.productionCompletedAt!, 120);
  });

  // 5. Guaranteed discontinued positions history.
  [
    { productId: "p10", offset: -85 },
    { productId: "p18", offset: -120 },
  ].forEach(({ productId, offset }) => {
    const product = products.find((item) => item.id === productId)!;
    const dayIndex = todayIndex + offset;
    const createdAt = moscowDate(dayIndex, 13, 0);
    const dueAt = moscowDate(dayIndex + 1, 18, 0);
    const order = createOrder({
      client: safeClients[5] ?? safeClients[0]!,
      product,
      quantity: 1,
      createdAt,
      paymentStatus: "paid",
      paidAt: addHours(createdAt, 1),
      stage: "delivered",
      dueAt,
      productionCompletedAt: addMinutes(dueAt, -60),
      productionEmployeeId: productionEmployeeFor("binding"),
      deliveryMethod: "pickup",
    });
    order.deliveredAt = addMinutes(order.productionCompletedAt!, 90);
  });

  // 6. Guaranteed production situations: binding bottleneck, overdue orders, payment sync errors.
  for (let i = 0; i < 9; i += 1) {
    const client = safeClients[(i * 3) % safeClients.length]!;
    const product = activeProducts[(i * 2) % activeProducts.length]!;
    const createdAt = addMinutes(now, -rng.int(120, 360));
    const dueAt = moscowDate(todayIndex + 1, 18, 0);
    createOrder({
      client,
      product,
      quantity: 1,
      createdAt,
      paymentStatus: "paid",
      paidAt: addMinutes(createdAt, 45),
      stage: "binding",
      dueAt,
      productionCompletedAt: null,
      productionEmployeeId: i < 7 ? "e11" : i === 7 ? "e12" : "e13",
      deliveryMethod: "delivery",
    });
  }

  const overdueSeeds: { stage: ProductionStage; employeeId: string; days: number }[] = [
    { stage: "prepress", employeeId: "e06", days: 2 },
    { stage: "print", employeeId: "e08", days: 3 },
    { stage: "binding", employeeId: "e11", days: 2 },
  ];
  overdueSeeds.forEach((seed, index) => {
    const createdAt = addHours(now, -seed.days * 24 - rng.int(1, 6));
    createOrder({
      client: safeClients[(index * 4 + 1) % safeClients.length]!,
      product: activeProducts[(index * 3) % activeProducts.length]!,
      quantity: 1,
      createdAt,
      paymentStatus: "paid",
      paidAt: addHours(createdAt, 2),
      stage: seed.stage,
      dueAt: addHours(now, -rng.int(6, 30)),
      productionCompletedAt: null,
      productionEmployeeId: seed.employeeId,
      deliveryMethod: "delivery",
    });
  });

  [
    { stage: "print" as const, employeeId: "e09" },
    { stage: "binding" as const, employeeId: "e12" },
  ].forEach((seed, index) => {
    const createdAt = addHours(now, -30 - index * 6);
    createOrder({
      client: safeClients[(index * 5 + 2) % safeClients.length]!,
      product: activeProducts[(index * 4 + 1) % activeProducts.length]!,
      quantity: 1,
      createdAt,
      paymentStatus: "sync_error",
      paidAt: addHours(createdAt, 1),
      stage: seed.stage,
      dueAt: moscowDate(todayIndex + 1, 18, 0),
      productionCompletedAt: null,
      productionEmployeeId: seed.employeeId,
      deliveryMethod: "delivery",
    });
  });

  // 7. Guaranteed orders awaiting payment for the pipeline demo.
  for (let i = 0; i < 2; i += 1) {
    const createdAt = addMinutes(now, -rng.int(30, 90));
    createOrder({
      client: safeClients[(i * 9 + 5) % safeClients.length]!,
      product: activeProducts[(i * 7 + 3) % activeProducts.length]!,
      quantity: 1,
      createdAt,
      paymentStatus: "pending",
      paidAt: null,
      stage: "awaiting_payment",
      dueAt: moscowDate(todayIndex + 1, 18, 0),
      productionCompletedAt: null,
      productionEmployeeId: null,
      deliveryMethod: "delivery",
    });
  }

  // 8. Guaranteed queue for the print specialist demo account (e08).
  for (let i = 0; i < 2; i += 1) {
    const createdAt = addHours(now, -8 - i * 2);
    createOrder({
      client: safeClients[(i * 6 + 3) % safeClients.length]!,
      product: activeProducts[(i * 5 + 2) % activeProducts.length]!,
      quantity: 1,
      createdAt,
      paymentStatus: "paid",
      paidAt: addMinutes(createdAt, 50),
      stage: "print",
      dueAt: moscowDate(todayIndex + 1, 18, 0),
      productionCompletedAt: null,
      productionEmployeeId: "e08",
      deliveryMethod: "delivery",
    });
  }

  // 9. Guaranteed delayed shipments.
  for (let i = 0; i < 3; i += 1) {
    const createdAt = addDays(now, -9 + i);
    const dueAt = addHours(createdAt, 30);
    const productionCompletedAt = addHours(now, -108 - i * 9);
    const order = createOrder({
      client: safeClients[(i * 7 + 4) % safeClients.length]!,
      product: activeProducts[(i * 6 + 3) % activeProducts.length]!,
      quantity: 1,
      createdAt,
      paymentStatus: "paid",
      paidAt: addHours(createdAt, 1),
      stage: "shipped",
      dueAt,
      productionCompletedAt,
      productionEmployeeId: productionEmployeeFor("binding"),
      deliveryMethod: "delivery",
    });
    createShipment({
      order,
      status: "delayed",
      shippedAt: addHours(productionCompletedAt, 4),
      eta: addHours(now, -(24 + i * 18)),
      deliveredAt: null,
      delayReason: DELAY_REASONS[i] ?? DELAY_REASONS[0]!,
    });
  }

  // 10. Support tickets: closed history plus active overdue and in-SLA requests.
  const deliveredOrders = orders.filter(
    (order) => order.stage === "delivered" && order.deliveredAt !== null,
  );
  for (let i = 0; i < deliveredOrders.length; i += 6) {
    if (!rng.chance(0.75)) continue;
    const order = deliveredOrders[i]!;
    const openedAt = addHours(order.deliveredAt!, -rng.int(2, 20));
    if (openedAt.getTime() >= now.getTime()) continue;
    const slowResponse = rng.chance(0.12);
    const firstResponseAt = addMinutes(openedAt, slowResponse ? rng.int(500, 900) : rng.int(35, 300));
    const closedAt = addMinutes(firstResponseAt, rng.int(60, 1200));
    if (closedAt.getTime() >= now.getTime()) continue;
    ticketCounter += 1;
    const ticket: SupportTicket = {
      id: `t-${pad(ticketCounter, 4)}`,
      orderId: order.id,
      clientId: order.clientId,
      topic: rng.pick(TICKET_TOPICS),
      status: "closed",
      openedAt,
      firstResponseAt,
      slaDueAt: addHours(openedAt, 8),
      closedAt,
      assigneeId: rng.pick(serviceEmployees).id,
    };
    tickets.push(ticket);
    order.supportTicketIds.push(ticket.id);
  }

  const recentActiveOrders = orders.filter(
    (order) =>
      order.paymentStatus !== "pending" &&
      (order.stage === "prepress" ||
        order.stage === "print" ||
        order.stage === "binding" ||
        order.stage === "ready" ||
        order.stage === "shipped") &&
      order.createdAt.getTime() > now.getTime() - 5 * 24 * 60 * 60 * 1000,
  );
  const ticketTargets = [0, 2, 4, 6, 8, 10]
    .map((index) => recentActiveOrders[index])
    .filter((order): order is Order => Boolean(order));

  ticketTargets.forEach((order, index) => {
    const overdue = index < 3;
    const openedAt = overdue
      ? addHours(now, -(48 + index * 26))
      : addHours(now, -(1 + (index - 3) * 1.5));
    const responded = overdue ? index !== 0 : index % 2 === 0;
    const assignee = index % 3 === 2 ? "e18" : "e17";
    ticketCounter += 1;
    const ticket: SupportTicket = {
      id: `t-${pad(ticketCounter, 4)}`,
      orderId: order.id,
      clientId: order.clientId,
      topic: overdue ? TICKET_TOPICS[3 + (index % 3)]! : TICKET_TOPICS[index % 3]!,
      status: overdue && index === 2 ? "in_progress" : "open",
      openedAt,
      firstResponseAt: responded ? addHours(openedAt, overdue ? 12 : 1) : null,
      slaDueAt: addHours(openedAt, 8),
      closedAt: null,
      assigneeId: assignee,
    };
    tickets.push(ticket);
    order.supportTicketIds.push(ticket.id);
  });

  return {
    generatedAt: now,
    seed,
    clients,
    products,
    employees,
    orders,
    shipments,
    tickets,
  };
}
