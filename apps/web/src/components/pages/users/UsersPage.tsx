import { PaginatedUsers } from "./PaginatedUsersContent";
import { UserSearchBar } from "@/features/users/components/UserSearchBar";
import { PublicUserSearchParams } from "@/types/search-params";

interface UserPageProps {
  searchParams?: PublicUserSearchParams;
}

export function UsersPage({ searchParams }: UserPageProps) {
  return (
    <div>
      <div className="flex justify-center relative items-center h-10 mb-4">
        <UserSearchBar basePath="/users" />
      </div>
      <PaginatedUsers searchParams={searchParams} />
    </div>
  );
}
