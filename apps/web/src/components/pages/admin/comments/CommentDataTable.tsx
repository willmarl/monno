"use client";

import { columns } from "./columns";
import { DataTable } from "@/components/ui/data-table";
import { OffsetPagination } from "@/components/ui/pagination/OffsetPagination";
import { useSearchParams } from "next/navigation";
import { useAdminComments } from "@/features/comments/hooks";
import { usePaginatedSearch } from "@/hooks/usePaginatedSearch";
import { AdminCommentSearchParams } from "@/types/search-params";
import { PageLoadingState } from "@/components/common/PageLoadingState";

interface CommentDataTableProps {
  searchParams?: AdminCommentSearchParams;
}

const DEFAULT_LIMIT = 4;

export function CommentDataTable({ searchParams }: CommentDataTableProps) {
  const {
    items: comments,
    totalItems,
    isLoading,
    page,
    emptyMessage,
    queryParams,
  } = usePaginatedSearch({
    searchParams,
    hook: useAdminComments, // <- Change me
    limit: DEFAULT_LIMIT,
    getEmptyMessage: (query) =>
      query
        ? `No comments found matching "${query}". Try a different search term.`
        : "No comments available.",
  });

  if (isLoading) {
    return <PageLoadingState variant="data-table" />;
  }

  return (
    <div>
      <DataTable columns={columns} data={comments} />
      <div className="mt-4">
        <OffsetPagination
          url="admin/comments"
          page={page}
          limit={DEFAULT_LIMIT}
          queryParams={queryParams}
          totalItems={totalItems}
        />
      </div>
    </div>
  );
}
