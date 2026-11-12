"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { findAccount, homeRoute } from "@/lib/auth/roles";
import { SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/auth/session";

export async function login(formData: FormData): Promise<void> {
  const accountId = String(formData.get("accountId") ?? "");
  const account = findAccount(accountId);
  if (!account) redirect("/login");

  const store = await cookies();
  store.set(SESSION_COOKIE, account.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  redirect(homeRoute(account.role));
}

export async function logout(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  redirect("/login");
}
