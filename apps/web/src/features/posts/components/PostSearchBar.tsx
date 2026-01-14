"use client";

import { SearchBar } from "@/features/search/components/SearchBar";
import { SearchFilterDropdown } from "@/features/search/components/SearchFilterDropdown";
import { usePostSuggestions } from "@/features/posts/hooks";
import {
  postSearchFilters,
  postSearchSorts,
} from "@/features/posts/types/search-config";
import { Post } from "../types/post";

export function PostSearchBar() {
  return (
    <div className="flex gap-2">
      <SearchBar<Post>
        placeholder="Search posts..."
        queryParam="q"
        basePath="/search"
        useSuggestions={usePostSuggestions}
        onNavigateTo={(post) => `post/${post.id}`}
      />

      <SearchFilterDropdown
        filters={postSearchFilters}
        sorts={postSearchSorts}
        basePath="/search"
      />
    </div>
  );
}
