import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  type DemoAccount,
  type PageKey,
  canAccess,
  findAccount,
  homeRoute,
} from "@/lib/auth/roles";

export const SESSION_COOKIE = "pp_session";
export const SESSION_MAX_AGE = 8 * 60 * 60;

export const getSession = cache(async (): Promise<DemoAccount | null> => {
  const store = await cookies();
  const accountId = store.get(SESSION_COOKIE)?.value;
  if (!accountId) return null;
  return findAccount(accountId);
});

export async function requireSession(): Promise<DemoAccount> {
  const account = await getSession();
  if (!account) redirect("/login");
  return account;
}

export async function requirePage(page: PageKey): Promise<DemoAccount> {
  const account = await requireSession();
  if (!canAccess(account.role, page)) redirect(homeRoute(account.role));
  return account;
}
