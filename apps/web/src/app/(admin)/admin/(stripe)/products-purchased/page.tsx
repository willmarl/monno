import { AdminProductPurchasesPage } from "@/components/pages/admin/stripe/products/AdminProductPurchasesPage";
import { AdminProductPurchasesSearchParams } from "@/types/search-params";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Products Purchased",
};
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
