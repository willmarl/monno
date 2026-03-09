"use client";

import { SearchBar } from "@/features/search/components/SearchBar";
import { SearchFilterDropdown } from "@/features/search/components/SearchFilterDropdown";
import {
  adminCollectionSearchFilters,
  adminCollectionSearchSorts,
} from "../types/search-config";
import { Collection } from "@/features/collections/types/collection";

interface AdminCollectionSearchBarProps {
  basePath?: string;
}

export function AdminCollectionSearchBar({
  basePath = "/admin/collections",
}: AdminCollectionSearchBarProps) {
  return (
    <div className="flex gap-2">
      <SearchBar<Collection>
        placeholder="Search collections..."
        queryParam="q"
        basePath={basePath}
      />

      <SearchFilterDropdown
        filters={adminCollectionSearchFilters}
        sorts={adminCollectionSearchSorts}
        basePath={basePath}
      />
    </div>
  );
}
