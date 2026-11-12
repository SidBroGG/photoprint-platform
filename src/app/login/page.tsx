import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { DEMO_ACCOUNTS, homeRoute } from "@/lib/auth/roles";
import { LoginView } from "@/components/login/LoginView";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const account = await getSession();
  if (account) redirect(homeRoute(account.role));
  return <LoginView accounts={DEMO_ACCOUNTS} />;
}
