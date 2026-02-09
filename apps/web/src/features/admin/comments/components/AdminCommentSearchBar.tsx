"use client";

import { SearchBar } from "@/features/search/components/SearchBar";
import { SearchFilterDropdown } from "@/features/search/components/SearchFilterDropdown";
import {
  adminCommentSearchFilters,
  adminCommentSearchSorts,
} from "../types/search-config";
import { Comment } from "@/features/comments/types/comment";

interface AdminCommentSearchBarProps {
  basePath?: string;
}

export function AdminCommentSearchBar({
  basePath = "/admin/comments",
}: AdminCommentSearchBarProps) {
  return (
    <div className="flex gap-2">
      <SearchBar<Comment>
        placeholder="Search comments..."
        queryParam="q"
        basePath={basePath}
      />

      <SearchFilterDropdown
        filters={adminCommentSearchFilters}
        sorts={adminCommentSearchSorts}
        basePath={basePath}
      />
    </div>
  );
}
