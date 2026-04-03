"use client";

import { PageLoadingState } from "@/components/common/PageLoadingState";
import { columns } from "./columns";
import { DataTable } from "@/components/ui/data-table";
import { OffsetPagination } from "@/components/ui/pagination/OffsetPagination";
import { useAdminArticlesOffset } from "@/features/admin/articles/hooks";
import { usePaginatedSearch } from "@/hooks/usePaginatedSearch";
import { AdminArticleSearchParams } from "@/types/search-params";

const DEFAULT_LIMIT = 10;

interface articleDataTableProps {
  searchParams?: AdminArticleSearchParams;
}

export function ArticleDataTable({ searchParams }: articleDataTableProps) {
  const {
    items: articles,
    totalItems,
    isLoading,
    page,
    emptyMessage,
    queryParams,
  } = usePaginatedSearch({
    searchParams,
    hook: useAdminArticlesOffset,
    limit: DEFAULT_LIMIT,
    getEmptyMessage: (query) =>
      query
        ? `No articles found matching "${query}". Try a different search term.`
        : "No articles available.",
  });

  if (isLoading) {
    return <PageLoadingState variant="data-table" />;
  }

  return (
    <div className="container mx-auto py-10">
      <DataTable columns={columns} data={articles} />
      <div className="mt-4">
        <OffsetPagination
          url="admin/articles"
          page={page}
          limit={DEFAULT_LIMIT}
          queryParams={queryParams}
          totalItems={totalItems}
        />
      </div>
    </div>
  );
}
