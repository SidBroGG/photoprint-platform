import { requirePage } from "@/lib/auth/session";
import { getDashboardView } from "@/lib/view/dashboard";
import { DashboardScreen } from "@/components/dashboard/DashboardScreen";

export default async function DashboardPage() {
  const account = await requirePage("dashboard");
  return <DashboardScreen data={getDashboardView(account)} />;
}
