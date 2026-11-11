import { requirePage } from "@/lib/auth/session";
import { getProductionScreenView } from "@/lib/view/production";
import { ProductionScreen } from "@/components/production/ProductionScreen";

export default async function ProductionPage() {
  const account = await requirePage("production");
  return <ProductionScreen data={getProductionScreenView(account)} />;
}
