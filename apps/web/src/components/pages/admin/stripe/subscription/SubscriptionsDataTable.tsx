"use client";

import { columns } from "./columns";
import { DataTable } from "@/components/ui/data-table";
import { useAdminSubscription } from "@/features/stripe/hooks";
import { OffsetPagination } from "@/components/ui/pagination/OffsetPagination";
import { usePaginatedSearch } from "@/hooks/usePaginatedSearch";
import { AdminSubscriptionsSearchParams } from "@/types/search-params";
import { PageLoadingState } from "@/components/common/PageLoadingState";

interface SubscriptionDataTableProps {
  searchParams?: AdminSubscriptionsSearchParams;
}

const DEFAULT_LIMIT = 20;

export function SubscriptionDataTable({
  searchParams,
}: SubscriptionDataTableProps) {
  const {
    items: subscription,
    totalItems,
    isLoading,
    page,
    emptyMessage,
    queryParams,
  } = usePaginatedSearch({
    searchParams,
    hook: useAdminSubscription,
    limit: DEFAULT_LIMIT,
    getEmptyMessage: (query) =>
      query
        ? `No subscription found matching "${query}". Try a different search term.`
        : "No subscription available.",
  });

  if (isLoading) {
    return <PageLoadingState variant="data-table" />;
  }

  return (
    <div>
      <DataTable columns={columns} data={subscription} />
      <div className="mt-4">
        <OffsetPagination
          url="admin/subscriptions"
          page={page}
          limit={DEFAULT_LIMIT}
          totalItems={totalItems}
          queryParams={queryParams}
        />
      </div>
    </div>
  );
}
