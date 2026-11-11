import { requirePage } from "@/lib/auth/session";
import { getProductsView } from "@/lib/view/products";
import { ProductsScreen } from "@/components/products/ProductsScreen";

export default async function ProductsPage() {
  await requirePage("products");
  return <ProductsScreen data={getProductsView()} />;
}
