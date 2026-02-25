"use client";

import { SearchBar } from "@/features/search/components/SearchBar";
import { SearchFilterDropdown } from "@/features/search/components/SearchFilterDropdown";
import { ticketSearchFilters, ticketSearchSorts } from "../types/search-config";
import { User } from "@/features/users/types/user";

interface AdminUserSearchBarProps {
  basePath?: string;
}

export function TicketSearchBar({
  basePath = "/admin/support",
}: AdminUserSearchBarProps) {
  return (
    <div className="flex gap-2">
      <SearchBar<User>
        placeholder="Search users..."
        queryParam="q"
        basePath={basePath}
      />

      <SearchFilterDropdown
        filters={ticketSearchFilters}
        sorts={ticketSearchSorts}
        basePath={basePath}
      />
    </div>
  );
}
