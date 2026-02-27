import { ProductPurchaseSearchBar } from "@/features/admin/stripe/components/ProductPurchasesSearchBar";
import { ProductPurchasesDataTable } from "./ProductPurchasesDataTable";
import { AdminProductPurchasesSearchParams } from "@/types/search-params";

interface AdminProductPurchasesPageProps {
  searchParams?: AdminProductPurchasesSearchParams;
}

export function AdminProductPurchasesPage({
  searchParams,
}: AdminProductPurchasesPageProps) {
  return (
    <div className="container mx-auto py-10 flex flex-col gap-4">
      <ProductPurchaseSearchBar basePath="/admin/products-purchased" />
      <ProductPurchasesDataTable searchParams={searchParams} />
    </div>
  );
}
