import type { ReactNode } from "react";
import { requireSession } from "@/lib/auth/session";
import { navItemsForRole } from "@/lib/auth/roles";
import { AppShell } from "@/components/app-shell/AppShell";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const account = await requireSession();
  return (
    <AppShell
      account={{ name: account.name, roleLabel: account.roleLabel }}
      navItems={navItemsForRole(account.role)}
    >
      {children}
    </AppShell>
  );
}
