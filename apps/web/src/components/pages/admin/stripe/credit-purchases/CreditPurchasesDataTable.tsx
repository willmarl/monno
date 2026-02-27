"use client";

import { columns } from "./columns";
import { DataTable } from "@/components/ui/data-table";
import { useAdminCreditPurchases } from "@/features/stripe/hooks";
import { OffsetPagination } from "@/components/ui/pagination/OffsetPagination";
import { usePaginatedSearch } from "@/hooks/usePaginatedSearch";
import { AdminCreditPurchasesSearchParams } from "@/types/search-params";
import { PageLoadingState } from "@/components/common/PageLoadingState";

interface CreditPurchasesDataTableProps {
  searchParams?: AdminCreditPurchasesSearchParams;
}

const DEFAULT_LIMIT = 20;

export function CreditPurchasesDataTable({
  searchParams,
}: CreditPurchasesDataTableProps) {
  const {
    items: creditpurchases,
    totalItems,
    isLoading,
    page,
    emptyMessage,
    queryParams,
  } = usePaginatedSearch({
    searchParams,
    hook: useAdminCreditPurchases,
    limit: DEFAULT_LIMIT,
    getEmptyMessage: (query) =>
      query
        ? `No creditpurchases found matching "${query}". Try a different search term.`
        : "No creditpurchases available.",
  });

  if (isLoading) {
    return <PageLoadingState variant="data-table" />;
  }

  return (
    <div>
      <DataTable columns={columns} data={creditpurchases} />
      <div className="mt-4">
        <OffsetPagination
          url="admin/credit-purchases"
          page={page}
          limit={DEFAULT_LIMIT}
          totalItems={totalItems}
          queryParams={queryParams}
        />
      </div>
    </div>
  );
}
