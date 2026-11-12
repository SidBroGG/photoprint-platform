import { requirePage } from "@/lib/auth/session";
import { getDashboardView } from "@/lib/view/dashboard";
import { getMarketingDashboardView } from "@/lib/view/marketing";
import { MetricsScreen } from "@/components/metrics/MetricsScreen";
import { MarketingDashboardScreen } from "@/components/marketing/MarketingDashboardScreen";

export default async function MetricsPage() {
  const account = await requirePage("metrics");
  if (account.role === "marketing") {
    return <MarketingDashboardScreen data={getMarketingDashboardView()} />;
  }
  return <MetricsScreen data={getDashboardView(account)} />;
}
