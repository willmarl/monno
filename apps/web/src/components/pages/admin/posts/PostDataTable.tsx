"use client";

import { useMemo, useState } from "react";
import type { RowSelectionState } from "@tanstack/react-table";
import { columns } from "./columns";
import { DataTable } from "@/components/ui/data-table";
import { OffsetPagination } from "@/components/ui/pagination/OffsetPagination";
import { PageLoadingState } from "@/components/common/PageLoadingState";
import { AdminBulkActionsBar } from "@/components/common/AdminBulkActionsBar";
import {
  useAdminBulkDeletePosts,
  useAdminBulkRestorePosts,
  useAdminPosts,
} from "@/features/posts/hooks";
import { usePaginatedSearch } from "@/hooks/usePaginatedSearch";
import { AdminPostSearchParams } from "@/types/search-params";
import type { Post } from "@/features/posts/types/post";

const DEFAULT_LIMIT = 20;

interface PostDataTableProps {
  searchParams?: AdminPostSearchParams;
}

export function PostDataTable({ searchParams }: PostDataTableProps) {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const bulkDelete = useAdminBulkDeletePosts();
  const bulkRestore = useAdminBulkRestorePosts();

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

  const selected = useMemo(
    () =>
      Object.keys(rowSelection)
        .filter((id) => rowSelection[id])
        .map((id) => posts.find((p) => String(p.id) === id))
        .filter((p): p is Post => !!p),
    [rowSelection, posts],
  );

  if (isLoading) {
    return <PageLoadingState variant="data-table" />;
  }

  return (
    <div>
      <AdminBulkActionsBar
        selected={selected}
        onClear={() => setRowSelection({})}
        resourceLabel="posts"
        isPending={bulkDelete.isPending || bulkRestore.isPending}
        onBulkDelete={(ids) => bulkDelete.mutateAsync(ids)}
        onBulkRestore={(ids) => bulkRestore.mutateAsync(ids)}
      />
      {posts.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          {emptyMessage}
        </p>
      ) : (
        <DataTable
          columns={columns}
          data={posts}
          enableRowSelection
          rowSelection={rowSelection}
          onRowSelectionChange={setRowSelection}
          getRowId={(row) => String(row.id)}
        />
      )}
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
