"use client";

import { columns } from "@/components/pages/admin/users/columns";
import { DataTable } from "@/components/ui/data-table";
import { useAdminUsers } from "@/features/users/hooks";
import { usePaginatedSearch } from "@/hooks/usePaginatedSearch";
import { OffsetPagination } from "@/components/ui/pagination/OffsetPagination";
import { AdminUserSearchParams } from "@/types/search-params";
import { PageLoadingState } from "@/components/common/PageLoadingState";

const DEFAULT_LIMIT = 2; // this set to low number for debugging next page

interface UserDataTableProps {
  searchParams?: AdminUserSearchParams;
}

export function UserDataTable({ searchParams }: UserDataTableProps) {
  const {
    items: users,
    totalItems,
    isLoading,
    page,
    emptyMessage,
    queryParams,
  } = usePaginatedSearch({
    searchParams,
    hook: useAdminUsers,
    limit: DEFAULT_LIMIT,
    getEmptyMessage: (query) =>
      query
        ? `No users found matching "${query}". Try a different search term.`
        : "No users available.",
  });

  if (isLoading) {
    return <PageLoadingState variant="data-table" />;
  }
  return (
    <div>
      <DataTable columns={columns} data={users} />
      <div className="mt-4">
        <OffsetPagination
          url="admin/users"
          page={page}
          limit={DEFAULT_LIMIT}
          totalItems={totalItems}
          queryParams={queryParams}
        />
      </div>
    </div>
  );
}
