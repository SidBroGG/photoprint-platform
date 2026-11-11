import { requirePage } from "@/lib/auth/session";
import { getForecastScreenView } from "@/lib/view/forecast";
import { ForecastScreen } from "@/components/forecast/ForecastScreen";

export default async function ForecastPage() {
  const account = await requirePage("forecast");
  return <ForecastScreen data={getForecastScreenView(account)} />;
}
