"use client";

import { columns } from "./columns";
import { DataTable } from "@/components/ui/data-table";
import { useAdminProducts } from "@/features/stripe/hooks";
import { OffsetPagination } from "@/components/ui/pagination/OffsetPagination";
import { usePaginatedSearch } from "@/hooks/usePaginatedSearch";
import { AdminProductPurchasesSearchParams } from "@/types/search-params";
import { PageLoadingState } from "@/components/common/PageLoadingState";

interface ProductPurchasesDataTableProps {
  searchParams?: AdminProductPurchasesSearchParams;
}

const DEFAULT_LIMIT = 20;

export function ProductPurchasesDataTable({
  searchParams,
}: ProductPurchasesDataTableProps) {
  const {
    items: productpurchases,
    totalItems,
    isLoading,
    page,
    emptyMessage,
    queryParams,
  } = usePaginatedSearch({
    searchParams,
    hook: useAdminProducts,
    limit: DEFAULT_LIMIT,
    getEmptyMessage: (query) =>
      query
        ? `No productpurchases found matching "${query}". Try a different search term.`
        : "No productpurchases available.",
  });

  if (isLoading) {
    return <PageLoadingState variant="data-table" />;
  }

  return (
    <div>
      <DataTable columns={columns} data={productpurchases} />
      <div className="mt-4">
        <OffsetPagination
          url="admin/products-purchased"
          page={page}
          limit={DEFAULT_LIMIT}
          totalItems={totalItems}
          queryParams={queryParams}
        />
      </div>
    </div>
  );
}
