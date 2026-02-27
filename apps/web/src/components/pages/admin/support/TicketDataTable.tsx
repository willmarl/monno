"use client";

import { columns } from "./columns";
import { DataTable } from "@/components/ui/data-table";
import { useSupporTicket } from "@/features/support/hooks";
import { OffsetPagination } from "@/components/ui/pagination/OffsetPagination";
import { usePaginatedSearch } from "@/hooks/usePaginatedSearch";
import { AdminSupportTicketSearchParams } from "@/types/search-params";
import { PageLoadingState } from "@/components/common/PageLoadingState";

interface TicketDataTableProps {
  searchParams?: AdminSupportTicketSearchParams;
}

const DEFAULT_LIMIT = 1;

export function TicketDataTable({ searchParams }: TicketDataTableProps) {
  const {
    items: tickets,
    totalItems,
    isLoading,
    page,
    emptyMessage,
    queryParams,
  } = usePaginatedSearch({
    searchParams,
    hook: useSupporTicket,
    limit: DEFAULT_LIMIT,
    getEmptyMessage: (query) =>
      query
        ? `No posts found matching "${query}". Try a different search term.`
        : "No posts available.",
  });

  if (isLoading) {
    return <PageLoadingState variant="data-table" />;
  }

  return (
    <div>
      <DataTable columns={columns} data={tickets} />
      <div className="mt-4">
        <OffsetPagination
          url="admin/support"
          page={page}
          limit={DEFAULT_LIMIT}
          queryParams={queryParams}
          totalItems={totalItems}
        />
      </div>
    </div>
  );
}
