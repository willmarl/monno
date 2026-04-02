"use client";

import { SearchBar } from "@/features/search/components/SearchBar";
import { SearchFilterDropdown } from "@/features/search/components/SearchFilterDropdown";
import { useArticleSuggestions } from "@/features/articles/hooks";
import {
  articleSearchFilters,
  articleSearchSorts,
} from "@/features/articles/types/search-config";
import { Article } from "../types/article";

const basePath = "/article";

export function ArticleSearchBar() {
  return (
    <div className="flex gap-2">
      <SearchBar<Article>
        placeholder="Search articles..."
        queryParam="q"
        basePath={basePath}
        useSuggestions={useArticleSuggestions}
        renderSuggestion={(article) => ({
          title: article.title,
          subtitle: article.content.substring(0, 60) + "...",
        })}
        onNavigateTo={(article) => `article/${article.id}`}
      />

      <SearchFilterDropdown
        filters={articleSearchFilters}
        sorts={articleSearchSorts}
        basePath={basePath}
      />
    </div>
  );
}
