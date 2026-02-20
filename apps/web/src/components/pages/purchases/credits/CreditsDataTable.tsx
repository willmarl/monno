"use client";

import { columns } from "./columns";
import { DataTable } from "@/components/ui/data-table";
import { useUserCreditTransactions } from "@/features/stripe/hooks";
import { OffsetPagination } from "@/components/ui/pagination/OffsetPagination";
import { useSearchParams } from "next/navigation";

const DEFAULT_LIMIT = 4;

export function CreditsDataTable() {
  // Parse page and limit from search params
  const searchParams = useSearchParams();

  // Get page from query params
  const page = parseInt(searchParams.get("page") ?? "1", 10);

  const { data, isLoading, error } = useUserCreditTransactions(
    page,
    DEFAULT_LIMIT,
  );

  if (isLoading) {
    return <div>Loading...</div>;
    // replace me with skeleton later
  }

  if (error || !data) {
    return (
      <div>Something went wrong. could not pull users. {error?.message}</div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <DataTable columns={columns} data={data.items} />
      <div className="mt-4">
        <OffsetPagination
          url="purchases/credits"
          page={page}
          limit={DEFAULT_LIMIT}
          totalItems={data.pageInfo.totalItems}
        />
      </div>
    </div>
  );
}
