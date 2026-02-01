import { PaginatedUsers } from "./PaginatedUsersContent";
import { UserSearchBar } from "@/features/users/components/UserSearchBar";
import { SearchTabs } from "@/components/SearchTabs";
import { PublicUserSearchParams } from "@/types/search-params";

interface UserPageProps {
  searchParams?: PublicUserSearchParams;
}

export function UsersPage({ searchParams }: UserPageProps) {
  return (
    <div>
      <div className="flex flex-col items-center gap-4 mb-4 relative">
        <SearchTabs activeTab="users" />
        <UserSearchBar basePath="/users" />
      </div>
      <PaginatedUsers searchParams={searchParams} />
    </div>
  );
}
