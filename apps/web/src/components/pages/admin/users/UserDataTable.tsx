"use client";

import { columns } from "@/components/pages/admin/users/columns";
import { DataTable } from "@/components/ui/data-table";
import { useAdminUsers } from "@/features/users/hooks";
import { usePaginatedSearch } from "@/hooks/usePaginatedSearch";
import { OffsetPagination } from "@/components/ui/pagination/OffsetPagination";
import { AdminUserSearchParams } from "@/types/search-params";

const DEFAULT_LIMIT = 10;

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
    return <div>Loading...</div>;
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
        />
      </div>
    </div>
  );
}
