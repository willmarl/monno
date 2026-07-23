"use client";

import { useMemo, useState } from "react";
import type { RowSelectionState } from "@tanstack/react-table";
import { columns } from "./columns";
import { DataTable } from "@/components/ui/data-table";
import { OffsetPagination } from "@/components/ui/pagination/OffsetPagination";
import { AdminBulkActionsBar } from "@/components/common/AdminBulkActionsBar";
import {
  useAdminBulkDeleteComments,
  useAdminBulkRestoreComments,
  useAdminComments,
} from "@/features/comments/hooks";
import { usePaginatedSearch } from "@/hooks/usePaginatedSearch";
import { AdminCommentSearchParams } from "@/types/search-params";
import { PageLoadingState } from "@/components/common/PageLoadingState";
import type { Comment } from "@/features/comments/types/comment";

interface CommentDataTableProps {
  searchParams?: AdminCommentSearchParams;
}

const DEFAULT_LIMIT = 20;

export function CommentDataTable({ searchParams }: CommentDataTableProps) {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const bulkDelete = useAdminBulkDeleteComments();
  const bulkRestore = useAdminBulkRestoreComments();

  const {
    items: comments,
    totalItems,
    isLoading,
    page,
    emptyMessage,
    queryParams,
  } = usePaginatedSearch({
    searchParams,
    hook: useAdminComments,
    limit: DEFAULT_LIMIT,
    getEmptyMessage: (query) =>
      query
        ? `No comments found matching "${query}". Try a different search term.`
        : "No comments available.",
  });

  const selected = useMemo(
    () =>
      Object.keys(rowSelection)
        .filter((id) => rowSelection[id])
        .map((id) => comments.find((c) => String(c.id) === id))
        .filter((c): c is Comment => !!c),
    [rowSelection, comments],
  );

  if (isLoading) {
    return <PageLoadingState variant="data-table" />;
  }

  return (
    <div>
      <AdminBulkActionsBar
        selected={selected}
        onClear={() => setRowSelection({})}
        resourceLabel="comments"
        isPending={bulkDelete.isPending || bulkRestore.isPending}
        onBulkDelete={(ids) => bulkDelete.mutateAsync(ids)}
        onBulkRestore={(ids) => bulkRestore.mutateAsync(ids)}
      />
      {comments.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          {emptyMessage}
        </p>
      ) : (
        <DataTable
          columns={columns}
          data={comments}
          enableRowSelection
          rowSelection={rowSelection}
          onRowSelectionChange={setRowSelection}
          getRowId={(row) => String(row.id)}
        />
      )}
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
