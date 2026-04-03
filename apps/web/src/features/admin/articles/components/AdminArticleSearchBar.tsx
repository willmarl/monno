"use client";

import { SearchBar } from "@/features/search/components/SearchBar";
import { SearchFilterDropdown } from "@/features/search/components/SearchFilterDropdown";
import {
  adminArticleSearchFilters,
  adminArticleSearchSorts,
} from "@/features/admin/articles/types/search-config";
import { Article } from "../types/article";

const basePath = "/admin/articles";

export function AdminArticleSearchBar() {
  return (
    <div className="flex gap-2">
      <SearchBar<Article>
        placeholder="Search articles..."
        queryParam="q"
        basePath={basePath}
      />

      <SearchFilterDropdown
        filters={adminArticleSearchFilters}
        sorts={adminArticleSearchSorts}
        basePath={basePath}
      />
    </div>
  );
}
