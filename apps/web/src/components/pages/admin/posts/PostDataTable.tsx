"use client";

import { columns } from "./columns";
import { DataTable } from "@/components/ui/data-table";
import { OffsetPagination } from "@/components/ui/pagination/OffsetPagination";
import { useAdminPosts } from "@/features/posts/hooks";
import { usePaginatedSearch } from "@/hooks/usePaginatedSearch";
import { AdminPostSearchParams } from "@/types/search-params";

const DEFAULT_LIMIT = 10;

interface PostDataTableProps {
  searchParams?: AdminPostSearchParams;
}

export function PostDataTable({ searchParams }: PostDataTableProps) {
  const {
    items: posts,
    totalItems,
    isLoading,
    page,
    emptyMessage,
  } = usePaginatedSearch({
    searchParams,
    hook: useAdminPosts,
    limit: DEFAULT_LIMIT,
    getEmptyMessage: (query) =>
      query
        ? `No users found matching "${query}". Try a different search term.`
        : "No users available.",
  });

  if (isLoading) {
    return <div>Loading...</div>;
    // replace me with skeleton later
  }

  return (
    <div className="container mx-auto py-10">
      <DataTable columns={columns} data={posts} />
      <div className="mt-4">
        <OffsetPagination
          url="admin/posts"
          page={page}
          limit={DEFAULT_LIMIT}
          totalItems={totalItems}
        />
      </div>
    </div>
  );
}
