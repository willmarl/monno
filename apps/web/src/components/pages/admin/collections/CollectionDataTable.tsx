"use client";

import { useMemo, useState } from "react";
import type { RowSelectionState } from "@tanstack/react-table";
import { columns } from "./columns";
import { DataTable } from "@/components/ui/data-table";
import { OffsetPagination } from "@/components/ui/pagination/OffsetPagination";
import { AdminBulkActionsBar } from "@/components/common/AdminBulkActionsBar";
import {
  useAdminBulkDeleteCollections,
  useAdminBulkRestoreCollections,
  useAdminCollections,
} from "@/features/collections/hooks";
import { usePaginatedSearch } from "@/hooks/usePaginatedSearch";
import { AdminCollectionSearchParams } from "@/types/search-params";
import { PageLoadingState } from "@/components/common/PageLoadingState";
import type { Collection } from "@/features/collections/types/collection";

interface CollectionDataTableProps {
  searchParams?: AdminCollectionSearchParams;
}

const DEFAULT_LIMIT = 20;

export function CollectionDataTable({
  searchParams,
}: CollectionDataTableProps) {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const bulkDelete = useAdminBulkDeleteCollections();
  const bulkRestore = useAdminBulkRestoreCollections();

  const {
    items: collections,
    totalItems,
    isLoading,
    page,
    emptyMessage,
    queryParams,
  } = usePaginatedSearch({
    searchParams,
    hook: useAdminCollections,
    limit: DEFAULT_LIMIT,
    getEmptyMessage: (query) =>
      query
        ? `No collections found matching "${query}". Try a different search term.`
        : "No collections available.",
  });

  const selected = useMemo(
    () =>
      Object.keys(rowSelection)
        .filter((id) => rowSelection[id])
        .map((id) => collections.find((c) => String(c.id) === id))
        .filter((c): c is Collection => !!c),
    [rowSelection, collections],
  );

  if (isLoading) {
    return <PageLoadingState variant="data-table" />;
  }

  return (
    <div>
      <AdminBulkActionsBar
        selected={selected}
        onClear={() => setRowSelection({})}
        resourceLabel="collections"
        isPending={bulkDelete.isPending || bulkRestore.isPending}
        onBulkDelete={(ids) => bulkDelete.mutateAsync(ids)}
        onBulkRestore={(ids) => bulkRestore.mutateAsync(ids)}
      />
      {collections.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          {emptyMessage}
        </p>
      ) : (
        <DataTable
          columns={columns}
          data={collections}
          enableRowSelection
          rowSelection={rowSelection}
          onRowSelectionChange={setRowSelection}
          getRowId={(row) => String(row.id)}
        />
      )}
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
