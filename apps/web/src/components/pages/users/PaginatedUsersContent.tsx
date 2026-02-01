"use client";

import { Suspense } from "react";
import { useUsers } from "@/features/users/hooks";
import { User } from "@/components/ui/User";
import { PaginatedList } from "@/components/ui/pagination/PaginatedList";
import { usePaginatedSearch } from "@/hooks/usePaginatedSearch";
import { UserSkeleton } from "@/components/skeletons/UserSkeleton";
import { PublicUserSearchParams } from "@/types/search-params";

const DEFAULT_LIMIT = 4;
interface PaginatedUsersProps {
  searchParams?: PublicUserSearchParams;
}

function UsersListContent({ searchParams }: PaginatedUsersProps) {
  const {
    items: users,
    totalItems,
    isLoading,
    queryParams,
    emptyMessage,
    page,
  } = usePaginatedSearch({
    searchParams,
    hook: useUsers,
    limit: DEFAULT_LIMIT,
    getEmptyMessage: (query) =>
      query
        ? `No users found matching "${query}". Try a different search term.`
        : "No users available.",
  });

  return (
    <PaginatedList
      url="users"
      page={page}
      limit={DEFAULT_LIMIT}
      items={users}
      totalItems={totalItems}
      isLoading={isLoading}
      renderItem={(user) => <User data={user} />}
      renderSkeleton={() => <UserSkeleton />}
      title="Users"
      layout="flex"
      queryParams={queryParams}
      emptyMessage={emptyMessage}
    />
  );
}

export function PaginatedUsers({ searchParams }: PaginatedUsersProps) {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <UsersListContent searchParams={searchParams} />
    </Suspense>
  );
}
