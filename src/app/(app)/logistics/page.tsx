import { requirePage } from "@/lib/auth/session";
import { getLogisticsView } from "@/lib/view/logistics";
import { LogisticsScreen } from "@/components/logistics/LogisticsScreen";

export default async function LogisticsPage() {
  await requirePage("logistics");
  return <LogisticsScreen data={getLogisticsView()} />;
}
