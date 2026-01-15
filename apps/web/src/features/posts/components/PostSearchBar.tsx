"use client";

import { SearchBar } from "@/features/search/components/SearchBar";
import { SearchFilterDropdown } from "@/features/search/components/SearchFilterDropdown";
import { usePostSuggestions } from "@/features/posts/hooks";
import {
  postSearchFilters,
  postSearchSorts,
} from "@/features/posts/types/search-config";
import { Post } from "../types/post";

interface PostSearchBarProps {
  basePath?: string;
}

export function PostSearchBar({ basePath = "/" }: PostSearchBarProps) {
  return (
    <div className="flex gap-2">
      <SearchBar<Post>
        placeholder="Search posts..."
        queryParam="q"
        basePath={basePath}
        useSuggestions={usePostSuggestions}
        onNavigateTo={(post) => `post/${post.id}`}
      />

      <SearchFilterDropdown
        filters={postSearchFilters}
        sorts={postSearchSorts}
        basePath={basePath}
      />
    </div>
  );
}
