import { notFound } from "next/navigation";
import { requirePage } from "@/lib/auth/session";
import { getOrderDetailView } from "@/lib/view/orders";
import { OrderDetailScreen } from "@/components/orders/OrderDetailScreen";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const account = await requirePage("orders");
  const { id } = await params;
  const view = getOrderDetailView(account, id);
  if (!view) notFound();
  return <OrderDetailScreen data={view} />;
}
