import { DEMO_ACCOUNTS, type Role } from "@/lib/auth/roles";
import { addHours } from "@/lib/dates";
import {
  ISSUE_CRITICALITIES,
  ISSUE_STATUSES,
  visibleIssueAreas,
} from "@/lib/board/labels";
import type {
  CreateIssueInput,
  Issue,
  IssueArea,
  IssueCriticality,
  IssueStatus,
  UpdateIssueInput,
} from "@/types/board";

export interface IssueActor {
  id: string;
  name: string;
  role: Role;
}

export interface IssueStoreState {
  issues: Issue[];
  nextNumber: number;
}

export type IssueMutationResult = { ok: true } | { ok: false; error: string };

const TITLE_MIN = 3;
const TITLE_MAX = 120;
const DESCRIPTION_MAX = 600;

interface SeedIssueInput {
  area: IssueArea;
  title: string;
  description: string;
  status: IssueStatus;
  criticality: IssueCriticality;
  assigneeId: string | null;
  createdById: string;
  createdHoursAgo: number;
  updatedHoursAgo: number;
}

const SEED_ISSUES: SeedIssueInput[] = [
  {
    area: "sales",
    title: "Синхронизация оплаты по заказу PP-1042",
    description:
      "Оплата прошла, но статус не передан в 1С. Пречек не сформирован — клиент ждёт подтверждения.",
    status: "in_progress",
    criticality: "critical",
    assigneeId: "sales",
    createdById: "sales",
    createdHoursAgo: 7,
    updatedHoursAgo: 1,
  },
  {
    area: "sales",
    title: "Клиент «Свадебный стиль» под риском",
    description:
      "Оборот упал на 62%, заказов нет 34 дня. Нужно связаться и подготовить персональное предложение.",
    status: "new",
    criticality: "high",
    assigneeId: null,
    createdById: "sales",
    createdHoursAgo: 30,
    updatedHoursAgo: 30,
  },
  {
    area: "sales",
    title: "Пересмотреть цену фотокниги «Классика»",
    description:
      "Маржинальность 21% при 14 заказах за месяц. Согласовать новую цену или себестоимость.",
    status: "review",
    criticality: "medium",
    assigneeId: "sales",
    createdById: "ceo",
    createdHoursAgo: 52,
    updatedHoursAgo: 5,
  },
  {
    area: "sales",
    title: "Сверка оплат за октябрь",
    description: "Расхождения между платформой и 1С устранены, акт сверки подписан.",
    status: "done",
    criticality: "low",
    assigneeId: "sales",
    createdById: "sales",
    createdHoursAgo: 96,
    updatedHoursAgo: 18,
  },
  {
    area: "production",
    title: "Очередь сборки выше сменной мощности",
    description:
      "На этапе сборки 8 заказов при мощности 6. Перераспределить смену и перенести неприоритетные заказы.",
    status: "in_progress",
    criticality: "critical",
    assigneeId: "production",
    createdById: "ceo",
    createdHoursAgo: 9,
    updatedHoursAgo: 2,
  },
  {
    area: "production",
    title: "Просрочены 3 заказа на печати",
    description:
      "Срок изготовления истёк. Нужно поднять приоритет и назначить ответственных на смену.",
    status: "new",
    criticality: "high",
    assigneeId: null,
    createdById: "production",
    createdHoursAgo: 5,
    updatedHoursAgo: 5,
  },
  {
    area: "production",
    title: "Калибровка печатного станка №2",
    description:
      "Проверить цветопередачу после замены чернил и зафиксировать результат в журнале.",
    status: "review",
    criticality: "medium",
    assigneeId: "prod-spec",
    createdById: "production",
    createdHoursAgo: 26,
    updatedHoursAgo: 3,
  },
  {
    area: "production",
    title: "Инвентаризация расходных материалов",
    description: "Остатки бумаги и чернил сверены, заявка на пополнение отправлена.",
    status: "done",
    criticality: "low",
    assigneeId: "production",
    createdById: "production",
    createdHoursAgo: 120,
    updatedHoursAgo: 40,
  },
  {
    area: "logistics",
    title: "Задержка отправления СДЭК PP-1048",
    description:
      "Нет сканирования 2 дня. Связаться с перевозчиком и уведомить клиента о новой дате.",
    status: "in_progress",
    criticality: "critical",
    assigneeId: "service",
    createdById: "ceo",
    createdHoursAgo: 11,
    updatedHoursAgo: 1,
  },
  {
    area: "logistics",
    title: "Самовывоз без трекинга",
    description:
      "Клиенты не получают уведомления о готовности к выдаче. Проверить триггер в сервисе.",
    status: "new",
    criticality: "medium",
    assigneeId: null,
    createdById: "service",
    createdHoursAgo: 20,
    updatedHoursAgo: 20,
  },
  {
    area: "logistics",
    title: "Проверить тарифы перевозчиков",
    description:
      "Сравнить стоимость доставки за октябрь и согласовать новый тариф СДЭК.",
    status: "new",
    criticality: "low",
    assigneeId: "service",
    createdById: "sales",
    createdHoursAgo: 48,
    updatedHoursAgo: 48,
  },
  {
    area: "logistics",
    title: "Сверить трекинг-номера за октябрь",
    description:
      "Номера отправлений сопоставлены с заказами, расхождений нет. Отчёт передан в сервис.",
    status: "done",
    criticality: "low",
    assigneeId: "service",
    createdById: "service",
    createdHoursAgo: 110,
    updatedHoursAgo: 36,
  },
  {
    area: "service",
    title: "3 обращения с истёкшим SLA",
    description:
      "Первый ответ не отправлен. Назначить исполнителей и ответить клиентам в течение часа.",
    status: "in_progress",
    criticality: "critical",
    assigneeId: "service-spec",
    createdById: "service",
    createdHoursAgo: 6,
    updatedHoursAgo: 1,
  },
  {
    area: "service",
    title: "Клиент не получил трек-номер",
    description:
      "Обращение по заказу PP-1051. Нужно ответить в течение часа и проверить отправление.",
    status: "new",
    criticality: "high",
    assigneeId: null,
    createdById: "service-spec",
    createdHoursAgo: 2,
    updatedHoursAgo: 2,
  },
  {
    area: "service",
    title: "Сократить регламент первого ответа",
    description:
      "Сейчас первый ответ занимает 45 минут, целевое значение — 15 минут. Подготовить изменения в регламент.",
    status: "review",
    criticality: "medium",
    assigneeId: "service",
    createdById: "ceo",
    createdHoursAgo: 70,
    updatedHoursAgo: 8,
  },
  {
    area: "service",
    title: "Обновить шаблоны ответов",
    description:
      "Шаблоны для задержек доставки и готовности к выдаче обновлены и согласованы.",
    status: "done",
    criticality: "low",
    assigneeId: "service-spec",
    createdById: "service",
    createdHoursAgo: 144,
    updatedHoursAgo: 60,
  },
];

function issueNumberId(number: number): string {
  return `ISS-${String(number).padStart(3, "0")}`;
}

function accountName(id: string): string {
  return DEMO_ACCOUNTS.find((account) => account.id === id)?.name ?? "Сотрудник";
}

export function createSeedIssues(now: Date): Issue[] {
  return SEED_ISSUES.map((seed, index) => {
    const number = index + 1;
    return {
      id: issueNumberId(number),
      number,
      area: seed.area,
      title: seed.title,
      description: seed.description,
      status: seed.status,
      criticality: seed.criticality,
      assigneeId: seed.assigneeId,
      assigneeName: seed.assigneeId ? accountName(seed.assigneeId) : null,
      createdById: seed.createdById,
      createdByName: accountName(seed.createdById),
      createdAt: addHours(now, -seed.createdHoursAgo),
      updatedAt: addHours(now, -seed.updatedHoursAgo),
    };
  });
}

const globalForIssues = globalThis as typeof globalThis & {
  __photoPrintIssueStore?: IssueStoreState;
};

export function getIssueStore(now: Date = new Date()): IssueStoreState {
  if (!globalForIssues.__photoPrintIssueStore) {
    const issues = createSeedIssues(now);
    globalForIssues.__photoPrintIssueStore = {
      issues,
      nextNumber: issues.length + 1,
    };
  }
  return globalForIssues.__photoPrintIssueStore;
}

export function resetIssueStore(): void {
  delete globalForIssues.__photoPrintIssueStore;
}

function normalizeTitle(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function normalizeDescription(value: string): string {
  return value
    .replace(/\r\n/g, "\n")
    .trim()
    .replace(/\n{3,}/g, "\n\n");
}

function validateTitle(title: string): string | null {
  if (title.length < TITLE_MIN) {
    return `Название задачи должно содержать минимум ${TITLE_MIN} символа.`;
  }
  if (title.length > TITLE_MAX) {
    return `Название задачи не длиннее ${TITLE_MAX} символов.`;
  }
  return null;
}

function validateDescription(description: string): string | null {
  if (description.length > DESCRIPTION_MAX) {
    return `Описание не длиннее ${DESCRIPTION_MAX} символов.`;
  }
  return null;
}

function fail(error: string): IssueMutationResult {
  return { ok: false, error };
}

function findIssue(state: IssueStoreState, issueId: string): Issue | undefined {
  return state.issues.find((issue) => issue.id === issueId);
}

function isVisible(state: IssueStoreState, actor: IssueActor, issue: Issue): boolean {
  return (
    state.issues.includes(issue) && visibleIssueAreas(actor.role).includes(issue.area)
  );
}

export function createIssue(
  state: IssueStoreState,
  actor: IssueActor,
  input: CreateIssueInput,
): IssueMutationResult {
  if (!visibleIssueAreas(actor.role).includes(input.area)) {
    return fail("Нет доступа к этой категории задач.");
  }
  if (!ISSUE_CRITICALITIES.includes(input.criticality)) {
    return fail("Некорректная критичность задачи.");
  }
  const title = normalizeTitle(input.title);
  const description = normalizeDescription(input.description);
  const titleError = validateTitle(title);
  if (titleError) return fail(titleError);
  const descriptionError = validateDescription(description);
  if (descriptionError) return fail(descriptionError);

  const number = state.nextNumber;
  state.nextNumber += 1;
  const now = new Date();
  state.issues.push({
    id: issueNumberId(number),
    number,
    area: input.area,
    title,
    description,
    status: "new",
    criticality: input.criticality,
    assigneeId: null,
    assigneeName: null,
    createdById: actor.id,
    createdByName: actor.name,
    createdAt: now,
    updatedAt: now,
  });
  return { ok: true };
}

export function updateIssue(
  state: IssueStoreState,
  actor: IssueActor,
  issueId: string,
  input: UpdateIssueInput,
): IssueMutationResult {
  const issue = findIssue(state, issueId);
  if (!issue) return fail("Задача не найдена.");
  if (!isVisible(state, actor, issue)) return fail("Нет доступа к этой задаче.");
  if (!ISSUE_STATUSES.includes(input.status)) return fail("Некорректный статус задачи.");
  if (!ISSUE_CRITICALITIES.includes(input.criticality)) {
    return fail("Некорректная критичность задачи.");
  }
  const title = normalizeTitle(input.title);
  const description = normalizeDescription(input.description);
  const titleError = validateTitle(title);
  if (titleError) return fail(titleError);
  const descriptionError = validateDescription(description);
  if (descriptionError) return fail(descriptionError);

  issue.title = title;
  issue.description = description;
  issue.criticality = input.criticality;
  issue.status = input.status;
  issue.updatedAt = new Date();
  return { ok: true };
}

export function setIssueStatus(
  state: IssueStoreState,
  actor: IssueActor,
  issueId: string,
  status: IssueStatus,
): IssueMutationResult {
  if (!ISSUE_STATUSES.includes(status)) return fail("Некорректный статус задачи.");
  const issue = findIssue(state, issueId);
  if (!issue) return fail("Задача не найдена.");
  if (!isVisible(state, actor, issue)) return fail("Нет доступа к этой задаче.");
  if (issue.status === status) return { ok: true };
  issue.status = status;
  issue.updatedAt = new Date();
  return { ok: true };
}

export function claimIssue(
  state: IssueStoreState,
  actor: IssueActor,
  issueId: string,
): IssueMutationResult {
  const issue = findIssue(state, issueId);
  if (!issue) return fail("Задача не найдена.");
  if (!isVisible(state, actor, issue)) return fail("Нет доступа к этой задаче.");
  if (issue.assigneeId !== null && issue.assigneeId !== actor.id) {
    return fail("Задача уже закреплена за другим сотрудником.");
  }
  issue.assigneeId = actor.id;
  issue.assigneeName = actor.name;
  issue.updatedAt = new Date();
  return { ok: true };
}

export function releaseIssue(
  state: IssueStoreState,
  actor: IssueActor,
  issueId: string,
): IssueMutationResult {
  const issue = findIssue(state, issueId);
  if (!issue) return fail("Задача не найдена.");
  if (!isVisible(state, actor, issue)) return fail("Нет доступа к этой задаче.");
  if (issue.assigneeId !== actor.id) {
    return fail("Снять задачу может только сотрудник, за которым она закреплена.");
  }
  issue.assigneeId = null;
  issue.assigneeName = null;
  issue.updatedAt = new Date();
  return { ok: true };
}
