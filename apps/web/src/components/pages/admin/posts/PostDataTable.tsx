"use client";

import { columns } from "./columns";
import { DataTable } from "@/components/ui/data-table";
import { OffsetPagination } from "@/components/ui/pagination/OffsetPagination";
import { PageLoadingState } from "@/components/common/PageLoadingState";
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
    queryParams,
  } = usePaginatedSearch({
    searchParams,
    hook: useAdminPosts,
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
      <DataTable columns={columns} data={posts} />
      <div className="mt-4">
        <OffsetPagination
          url="admin/posts"
          page={page}
          limit={DEFAULT_LIMIT}
          queryParams={queryParams}
          totalItems={totalItems}
        />
      </div>
    </div>
  );
}
