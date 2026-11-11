import { requirePage } from "@/lib/auth/session";
import { getOrdersView } from "@/lib/view/orders";
import { OrdersScreen } from "@/components/orders/OrdersScreen";

export default async function OrdersPage() {
  const account = await requirePage("orders");
  return <OrdersScreen data={getOrdersView(account)} />;
}
