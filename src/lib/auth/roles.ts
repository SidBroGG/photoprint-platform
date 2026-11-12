import type { Department } from "@/types/domain";

export type Role = "ceo" | "sales" | "production" | "logistics_service";

export type PageKey =
  | "dashboard"
  | "issues"
  | "orders"
  | "customers"
  | "products"
  | "production"
  | "logistics"
  | "service"
  | "personnel"
  | "forecast";

export type DashboardDomain = "sales" | "finance" | "production" | "logistics" | "service";

export interface DemoAccount {
  id: string;
  name: string;
  role: Role;
  roleLabel: string;
  description: string;
  home: string;
  employeeId?: string;
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    id: "ceo",
    name: "Анна Смирнова",
    role: "ceo",
    roleLabel: "Генеральный директор",
    description: "Полная картина компании: продажи, финансы, производство, логистика и сервис.",
    home: "/dashboard",
  },
  {
    id: "sales",
    name: "Игорь Волков",
    role: "sales",
    roleLabel: "Руководитель продаж и финансов",
    description: "Продажи, финансы, клиенты и продукты. Суммы и маржа доступны.",
    home: "/dashboard",
    employeeId: "e01",
  },
  {
    id: "production",
    name: "Мария Кузнецова",
    role: "production",
    roleLabel: "Руководитель производства",
    description: "Производство, заказы без финансовых полей, персонал цеха.",
    home: "/dashboard",
    employeeId: "e05",
  },
  {
    id: "service",
    name: "Дмитрий Орлов",
    role: "logistics_service",
    roleLabel: "Руководитель логистики и клиентского сервиса",
    description: "Доставка, трекинг, обращения и SLA. Без сумм и маржи.",
    home: "/dashboard",
    employeeId: "e14",
  },
];

export const PAGE_ACCESS: Record<PageKey, Role[]> = {
  dashboard: ["ceo", "sales", "production", "logistics_service"],
  issues: ["ceo", "sales", "production", "logistics_service"],
  orders: ["ceo", "sales", "production", "logistics_service"],
  customers: ["ceo", "sales"],
  products: ["ceo", "sales"],
  production: ["ceo", "production"],
  logistics: ["ceo", "logistics_service"],
  service: ["ceo", "logistics_service"],
  personnel: ["ceo", "sales", "production", "logistics_service"],
  forecast: ["ceo", "sales", "production", "logistics_service"],
};

export const ROLE_LABELS: Record<Role, string> = {
  ceo: "Генеральный директор",
  sales: "Руководитель продаж и финансов",
  production: "Руководитель производства",
  logistics_service: "Руководитель логистики и клиентского сервиса",
};

export interface NavItem {
  href: string;
  label: string;
  page: PageKey;
  icon: string;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Обзор", page: "dashboard", icon: "dashboard" },
  { href: "/issues", label: "Канбан", page: "issues", icon: "board" },
  { href: "/orders", label: "Заказы", page: "orders", icon: "orders" },
  { href: "/customers", label: "Клиенты", page: "customers", icon: "customers" },
  { href: "/products", label: "Продукты", page: "products", icon: "products" },
  { href: "/production", label: "Производство", page: "production", icon: "production" },
  { href: "/logistics", label: "Логистика", page: "logistics", icon: "logistics" },
  { href: "/service", label: "Клиентский сервис", page: "service", icon: "service" },
  { href: "/personnel", label: "Персонал", page: "personnel", icon: "personnel" },
  { href: "/forecast", label: "Прогноз", page: "forecast", icon: "forecast" },
];

export function findAccount(id: string): DemoAccount | null {
  return DEMO_ACCOUNTS.find((account) => account.id === id) ?? null;
}

export function canAccess(role: Role, page: PageKey): boolean {
  return PAGE_ACCESS[page].includes(role);
}

export function homeRoute(): string {
  return "/dashboard";
}

export function navItemsForRole(role: Role): NavItem[] {
  return NAV_ITEMS.filter((item) => canAccess(role, item.page));
}

export function dashboardDomains(role: Role): DashboardDomain[] {
  switch (role) {
    case "ceo":
      return ["sales", "finance", "production", "logistics", "service"];
    case "sales":
      return ["sales", "finance"];
    case "production":
      return ["production"];
    case "logistics_service":
      return ["logistics", "service"];
    default:
      return [];
  }
}

export function personnelDepartments(role: Role): Department[] | undefined {
  switch (role) {
    case "ceo":
      return undefined;
    case "sales":
      return ["sales"];
    case "production":
      return ["production"];
    case "logistics_service":
      return ["logistics", "service"];
    default:
      return undefined;
  }
}

export function canSeeOrderMoney(role: Role): boolean {
  return role === "ceo" || role === "sales";
}
