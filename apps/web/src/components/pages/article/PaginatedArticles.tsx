"use client";

import { Suspense } from "react";
import { useArticlesOffset } from "@/features/articles/hooks";
import { Article } from "@/components/ui/Article";
import { PaginatedList } from "@/components/ui/pagination/PaginatedList";
import { usePaginatedSearch } from "@/hooks/usePaginatedSearch";
import { PageLoadingState } from "@/components/common/PageLoadingState";
import { PublicArticleSearchParams } from "@/types/search-params";

const DEFAULT_LIMIT = 4;
interface PaginatedArticlesProps {
  searchParams?: PublicArticleSearchParams;
}

function ArticlesListContent({ searchParams }: PaginatedArticlesProps) {
  const {
    items: articles,
    totalItems,
    isLoading,
    queryParams,
    emptyMessage,
    page,
  } = usePaginatedSearch({
    searchParams,
    hook: useArticlesOffset,
    limit: DEFAULT_LIMIT,
    getEmptyMessage: (query) =>
      query
        ? `No articles found matching "${query}". Try a different search term.`
        : "No articles available.",
  });

  return (
    <PaginatedList
      url="article"
      page={page}
      limit={DEFAULT_LIMIT}
      items={articles}
      totalItems={totalItems}
      isLoading={isLoading}
      renderItem={(article) => <Article data={article} />}
      renderSkeleton={() => <PageLoadingState variant="card" />}
      title="Articles"
      layout="flex"
      queryParams={queryParams}
      emptyMessage={emptyMessage}
    />
  );
}

export function PaginatedArticles({ searchParams }: PaginatedArticlesProps) {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <ArticlesListContent searchParams={searchParams} />
    </Suspense>
  );
}
