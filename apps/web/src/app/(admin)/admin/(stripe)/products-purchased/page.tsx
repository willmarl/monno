import { AdminProductPurchasesPage } from "@/components/pages/admin/stripe/products/AdminProductPurchasesPage";
import { AdminProductPurchasesSearchParams } from "@/types/search-params";

export default async function page({
  searchParams,
}: {
  searchParams: Promise<AdminProductPurchasesSearchParams>;
}) {
  const params = await searchParams;
  return (
    <div>
      <AdminProductPurchasesPage searchParams={params} />
    </div>
  );
}
