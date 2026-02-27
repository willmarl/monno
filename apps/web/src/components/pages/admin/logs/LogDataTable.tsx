"use client";

import { useLogs } from "@/features/admin/hooks";
import { columns } from "./columns";
import { DataTable } from "@/components/ui/data-table";
import { OffsetPagination } from "@/components/ui/pagination/OffsetPagination";
import { useSearchParams } from "next/navigation";
import { PageLoadingState } from "@/components/common/PageLoadingState";

const DEFAULT_LIMIT = 4;

export function LogDataTable() {
  // Parse page and limit from search params
  const searchParams = useSearchParams();

  // Get page from query params
  const page = parseInt(searchParams.get("page") ?? "1", 10);

  const { data, isLoading, error } = useLogs(page, DEFAULT_LIMIT);

  if (isLoading) {
    return <PageLoadingState variant="data-table" />;
  }

  if (error || !data) {
    return (
      <div>Something went wrong. could not pull logs. {error?.message}</div>
    );
  }

  return (
    <div>
      <DataTable columns={columns} data={data.items} />
      <div className="mt-4">
        <OffsetPagination
          url="admin/logs"
          page={page}
          limit={DEFAULT_LIMIT}
          totalItems={data.pageInfo.totalItems}
        />
      </div>
    </div>
  );
}
