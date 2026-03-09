"use client";

import { columns } from "./columns";
import { DataTable } from "@/components/ui/data-table";
import { OffsetPagination } from "@/components/ui/pagination/OffsetPagination";
import { useSearchParams } from "next/navigation";
import { useAdminCollections } from "@/features/collections/hooks";
import { usePaginatedSearch } from "@/hooks/usePaginatedSearch";
import { AdminCollectionSearchParams } from "@/types/search-params";
import { PageLoadingState } from "@/components/common/PageLoadingState";

interface CollectionDataTableProps {
  searchParams?: AdminCollectionSearchParams;
}

const DEFAULT_LIMIT = 20;

export function CollectionDataTable({
  searchParams,
}: CollectionDataTableProps) {
  const {
    items: collections,
    totalItems,
    isLoading,
    page,
    emptyMessage,
    queryParams,
  } = usePaginatedSearch({
    searchParams,
    hook: useAdminCollections, // <- Change me
    limit: DEFAULT_LIMIT,
    getEmptyMessage: (query) =>
      query
        ? `No collections found matching "${query}". Try a different search term.`
        : "No collections available.",
  });

  if (isLoading) {
    return <PageLoadingState variant="data-table" />;
  }

  return (
    <div>
      <DataTable columns={columns} data={collections} />
      <div className="mt-4">
        <OffsetPagination
          url="admin/collections"
          page={page}
          limit={DEFAULT_LIMIT}
          queryParams={queryParams}
          totalItems={totalItems}
        />
      </div>
    </div>
  );
}
