import type { DemoAccount } from "@/lib/auth/roles";
import { getDataset } from "@/lib/data/store";
import { productionView } from "@/lib/analytics/operations";
import { ORDER_STAGE_LABELS, STAGE_LABELS } from "@/lib/labels";
import { formatDateTime, formatNumber, formatPercent } from "@/lib/format";
import type { KpiVM } from "@/lib/view/dashboard";

export interface StageLoadVM {
  stage: string;
  label: string;
  queue: number;
  capacity: number;
  loadLabel: string;
  loadPct: number;
  isBottleneck: boolean;
}

export interface ProductionRiskVM {
  id: string;
  number: string;
  productName: string;
  stageLabel: string;
  assigneeName: string;
  dueLabel: string;
  reason: string;
  overdue: boolean;
}

export interface ProductionScreenView {
  mode: "company" | "specialist";
  meta: string;
  note: string;
  kpis: KpiVM[];
  stages: StageLoadVM[];
  risks: ProductionRiskVM[];
  stageLabel?: string;
}

export function getProductionScreenView(
  account: DemoAccount,
  now: Date = new Date(),
): ProductionScreenView {
  const dataset = getDataset(now);
  const specialist = account.role === "production_specialist";
  const employee = account.employeeId
    ? dataset.employees.find((item) => item.id === account.employeeId)
    : undefined;
  const view = productionView(
    dataset.orders,
    now,
    specialist ? account.employeeId : undefined,
  );
  const productById = new Map(dataset.products.map((product) => [product.id, product]));
  const employeeById = new Map(dataset.employees.map((item) => [item.id, item]));
  const stageLoadByStage = new Map(view.stages.map((stage) => [stage.stage, stage]));

  const stages: StageLoadVM[] = view.stages.map((stage) => ({
    stage: stage.stage,
    label: stage.label,
    queue: stage.queue,
    capacity: stage.capacity,
    loadLabel: formatPercent(stage.loadPct, 0),
    loadPct: stage.loadPct,
    isBottleneck: stage.isBottleneck,
  }));

  const risks: ProductionRiskVM[] = view.riskOrders.map((order) => {
    const overdue = order.dueAt.getTime() < now.getTime();
    const stageLabel = ORDER_STAGE_LABELS[order.stage];
    const companyStage =
      order.stage === "prepress" || order.stage === "print" || order.stage === "binding"
        ? stageLoadByStage.get(order.stage)
        : undefined;
    const reason = overdue
      ? `Срок истёк: задержка на этапе «${stageLabel}»`
      : !specialist && companyStage?.isBottleneck
        ? `Узкое место: очередь ${companyStage.queue} при мощности ${companyStage.capacity}`
        : "Срок истекает в ближайшие 12 часов";
    return {
      id: order.id,
      number: order.id,
      productName: productById.get(order.productId)?.name ?? "—",
      stageLabel,
      assigneeName: order.productionEmployeeId
        ? employeeById.get(order.productionEmployeeId)?.name ?? "—"
        : "—",
      dueLabel: formatDateTime(order.dueAt),
      reason,
      overdue,
    };
  });

  const kpis: KpiVM[] = specialist
    ? [
        {
          label: "В моей очереди",
          value: formatNumber(view.inProduction),
          hint: employee?.stage ? `Стадия «${STAGE_LABELS[employee.stage]}»` : "Назначенные заказы",
        },
        {
          label: "Просрочено",
          value: formatNumber(view.overdue),
          hint: "Мои заказы с истёкшим сроком",
          tone: view.overdue > 0 ? "error" : "default",
        },
        {
          label: "Готовы к передаче",
          value: formatNumber(view.ready),
          hint: "Мои готовые заказы",
        },
        {
          label: "Моя стадия",
          value: employee?.stage ? STAGE_LABELS[employee.stage] : "—",
          hint: "Только назначенные вам заказы",
          tone: "accent",
        },
      ]
    : [
        {
          label: "В производстве",
          value: formatNumber(view.inProduction),
          hint: "Активные заказы на этапах",
        },
        {
          label: "Просрочено",
          value: formatNumber(view.overdue),
          hint: "Срок изготовления истёк",
          tone: view.overdue > 0 ? "error" : "default",
        },
        {
          label: "Готовы к отправке",
          value: formatNumber(view.ready),
          hint: "Ожидают передачи в доставку",
        },
        {
          label: "Соблюдение срока",
          value: formatPercent(view.compliance, 0),
          hint: "Завершено за 30 дней в срок",
          tone: view.compliance >= 0.9 ? "success" : view.compliance >= 0.8 ? "warning" : "error",
        },
      ];

  return {
    mode: specialist ? "specialist" : "company",
    meta: `Данные на ${formatDateTime(now)} · срок изготовления — один день`,
    note: specialist
      ? "Показана только ваша очередь и ваши просрочки. Агрегаты компании скрыты."
      : "Загрузка этапов, узкие места и контроль сроков изготовления.",
    kpis,
    stages,
    risks,
    stageLabel: employee?.stage ? STAGE_LABELS[employee.stage] : undefined,
  };
}
