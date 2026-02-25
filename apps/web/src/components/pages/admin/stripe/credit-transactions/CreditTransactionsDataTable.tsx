"use client";

import { columns } from "./columns";
import { DataTable } from "@/components/ui/data-table";
import { useAdminCreditTransactions } from "@/features/stripe/hooks";
import { OffsetPagination } from "@/components/ui/pagination/OffsetPagination";
import { usePaginatedSearch } from "@/hooks/usePaginatedSearch";
import { AdminCreditTransactionsSearchParams } from "@/types/search-params";

interface CreditTransactionsDataTableProps {
  searchParams?: AdminCreditTransactionsSearchParams;
}

const DEFAULT_LIMIT = 1;

export function CreditTransactionsDataTable({
  searchParams,
}: CreditTransactionsDataTableProps) {
  const {
    items: credittransactions,
    totalItems,
    isLoading,
    page,
    emptyMessage,
    queryParams,
  } = usePaginatedSearch({
    searchParams,
    hook: useAdminCreditTransactions,
    limit: DEFAULT_LIMIT,
    getEmptyMessage: (query) =>
      query
        ? `No credittransactions found matching "${query}". Try a different search term.`
        : "No credittransactions available.",
  });

  if (isLoading) {
    return <div>Loading...</div>;
    // replace me with skeleton later
  }

  return (
    <div>
      <DataTable columns={columns} data={credittransactions} />
      <div className="mt-4">
        <OffsetPagination
          url="admin/credit-transactions"
          page={page}
          limit={DEFAULT_LIMIT}
          totalItems={totalItems}
          queryParams={queryParams}
        />
      </div>
    </div>
  );
}
