"use client";

import { useMemo, useState } from "react";
import type { RowSelectionState } from "@tanstack/react-table";
import { PageLoadingState } from "@/components/common/PageLoadingState";
import { AdminBulkActionsBar } from "@/components/common/AdminBulkActionsBar";
import { columns } from "./columns";
import { DataTable } from "@/components/ui/data-table";
import { OffsetPagination } from "@/components/ui/pagination/OffsetPagination";
import {
  useAdminArticlesOffset,
  useAdminBulkDeleteArticles,
  useAdminBulkRestoreArticles,
} from "@/features/admin/articles/hooks";
import { usePaginatedSearch } from "@/hooks/usePaginatedSearch";
import { AdminArticleSearchParams } from "@/types/search-params";
import type { Article } from "@/features/admin/articles/types/article";

const DEFAULT_LIMIT = 10;

interface articleDataTableProps {
  searchParams?: AdminArticleSearchParams;
}

export function ArticleDataTable({ searchParams }: articleDataTableProps) {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const bulkDelete = useAdminBulkDeleteArticles();
  const bulkRestore = useAdminBulkRestoreArticles();

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

  const selected = useMemo(
    () =>
      Object.keys(rowSelection)
        .filter((id) => rowSelection[id])
        .map((id) => articles.find((a) => String(a.id) === id))
        .filter((a): a is Article => !!a),
    [rowSelection, articles],
  );

  if (isLoading) {
    return <PageLoadingState variant="data-table" />;
  }

  return (
    <div className="container mx-auto py-10">
      <AdminBulkActionsBar
        selected={selected}
        onClear={() => setRowSelection({})}
        resourceLabel="articles"
        isPending={bulkDelete.isPending || bulkRestore.isPending}
        onBulkDelete={(ids) => bulkDelete.mutateAsync(ids)}
        onBulkRestore={(ids) => bulkRestore.mutateAsync(ids)}
      />
      {articles.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          {emptyMessage}
        </p>
      ) : (
        <DataTable
          columns={columns}
          data={articles}
          enableRowSelection
          rowSelection={rowSelection}
          onRowSelectionChange={setRowSelection}
          getRowId={(row) => String(row.id)}
        />
      )}
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
