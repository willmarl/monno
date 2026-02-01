"use client";

import { SearchBar } from "@/features/search/components/SearchBar";
import { SearchFilterDropdown } from "@/features/search/components/SearchFilterDropdown";
import {
  userSearchFilters,
  userSearchSorts,
} from "@/features/users/types/search-config";
import { User } from "../types/user";

interface UserSearchBarProps {
  basePath?: string;
}

export function UserSearchBar({ basePath = "/" }: UserSearchBarProps) {
  return (
    <div className="flex gap-2">
      <SearchBar<User>
        placeholder="Search users..."
        queryParam="q"
        basePath={basePath}
      />

      <SearchFilterDropdown
        filters={userSearchFilters}
        sorts={userSearchSorts}
        basePath={basePath}
      />
    </div>
  );
}
