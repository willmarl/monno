"use client";

import { SearchBar } from "@/features/search/components/SearchBar";
import { SearchFilterDropdown } from "@/features/search/components/SearchFilterDropdown";
import {
  adminPostSearchFilters,
  adminPostSearchSorts,
} from "../types/search-config";
import { User } from "@/features/users/types/user";

interface AdminUserSearchBarProps {
  basePath?: string;
}

export function AdminPostSearchBar({
  basePath = "/admin/posts",
}: AdminUserSearchBarProps) {
  return (
    <div className="flex gap-2">
      <SearchBar<User>
        placeholder="Search users..."
        queryParam="q"
        basePath={basePath}
      />

      <SearchFilterDropdown
        filters={adminPostSearchFilters}
        sorts={adminPostSearchSorts}
        basePath={basePath}
      />
    </div>
  );
}
