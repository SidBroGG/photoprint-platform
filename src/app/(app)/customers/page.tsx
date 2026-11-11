import { requirePage } from "@/lib/auth/session";
import { getCustomersView } from "@/lib/view/customers";
import { CustomersScreen } from "@/components/customers/CustomersScreen";

export default async function CustomersPage() {
  await requirePage("customers");
  return <CustomersScreen data={getCustomersView()} />;
}
