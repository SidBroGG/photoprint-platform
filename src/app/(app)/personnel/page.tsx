import { requirePage } from "@/lib/auth/session";
import { getPersonnelScreenView } from "@/lib/view/personnel";
import { PersonnelScreen } from "@/components/personnel/PersonnelScreen";

export default async function PersonnelPage() {
  const account = await requirePage("personnel");
  return <PersonnelScreen data={getPersonnelScreenView(account)} />;
}
