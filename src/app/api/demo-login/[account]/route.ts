import { NextResponse, type NextRequest } from "next/server";
import { canAccess, findAccount, homeRoute, type PageKey, type Role } from "@/lib/auth/roles";
import { SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/auth/session";

const PAGE_KEYS: PageKey[] = [
  "dashboard",
  "orders",
  "customers",
  "products",
  "production",
  "logistics",
  "service",
  "personnel",
  "forecast",
];

function resolveTarget(value: string | null, home: string, role: Role): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return home;
  const pathname = value.split(/[?#]/)[0];
  const segment = pathname.split("/").filter(Boolean)[0];
  if (!segment || !PAGE_KEYS.includes(segment as PageKey)) return home;
  return canAccess(role, segment as PageKey) ? value : home;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ account: string }> },
) {
  const { account: accountId } = await context.params;
  const account = findAccount(accountId);
  if (!account) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const target = resolveTarget(
    request.nextUrl.searchParams.get("next"),
    homeRoute(account.role),
    account.role,
  );
  const response = NextResponse.redirect(new URL(target, request.url));
  response.cookies.set(SESSION_COOKIE, account.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return response;
}
