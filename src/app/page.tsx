import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { homeRoute } from "@/lib/auth/roles";

export const dynamic = "force-dynamic";

export default async function RootPage() {
  const account = await getSession();
  redirect(account ? homeRoute(account.role) : "/login");
}
