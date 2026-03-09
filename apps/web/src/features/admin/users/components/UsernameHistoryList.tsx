"use client";

import { useAdminUsernameHistory } from "@/features/users/hooks";
import { PaginatedListInline } from "@/components/ui/pagination/PaginatedListInline";
import { useState } from "react";
import { formatDate } from "@/lib/utils/date";

const DEFAULT_LIMIT = 10;

export function UsernameHistoryList({ userId }: { userId: number }) {
  const [page, setPage] = useState(1);
  const { data: usernameData, isLoading } = useAdminUsernameHistory(
    userId,
    page,
    DEFAULT_LIMIT,
  );
  const usernameLog = usernameData?.items ?? [];
  const totalItems =
    usernameData?.pageInfo?.total ?? usernameData?.pageInfo?.totalItems ?? 0;

  return (
    <PaginatedListInline
      page={page}
      limit={DEFAULT_LIMIT}
      items={usernameLog}
      totalItems={totalItems}
      isLoading={isLoading}
      onPageChange={setPage}
      renderItem={(usernameLog) => (
        <div className="border-l-2 border-border pl-3">
          <div className="flex justify-between items-center">
            <span className="font-medium">{usernameLog.username}</span>
            <span className="text-sm text-muted-foreground">
              {formatDate(usernameLog.freedAt)}
            </span>
          </div>
          <div className="text-sm text-muted-foreground/50 mt-1 capitalize">
            {usernameLog.reason?.replace(/_/g, " ")}
          </div>
        </div>
      )}
      layout="flex"
      gridClassName="flex flex-col gap-3"
      emptyMessage="No changes made"
    />
  );
}
