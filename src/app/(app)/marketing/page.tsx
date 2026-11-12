import { requirePage } from "@/lib/auth/session";
import { getMarketingDashboardView } from "@/lib/view/marketing";
import { MarketingDashboardScreen } from "@/components/marketing/MarketingDashboardScreen";

export default async function MarketingPage() {
  await requirePage("marketing");
  return <MarketingDashboardScreen data={getMarketingDashboardView()} />;
}
