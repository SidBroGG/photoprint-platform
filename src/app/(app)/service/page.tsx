import { requirePage } from "@/lib/auth/session";
import { getServiceScreenView } from "@/lib/view/service";
import { ServiceScreen } from "@/components/service/ServiceScreen";

export default async function ServicePage() {
  const account = await requirePage("service");
  return <ServiceScreen data={getServiceScreenView(account)} />;
}
