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
    <div>
      <ProductPurchaseSearchBar basePath="/admin/products-purchased" />
      <ProductPurchasesDataTable searchParams={searchParams} />
    </div>
  );
}
