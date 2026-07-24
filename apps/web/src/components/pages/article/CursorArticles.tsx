"use client";

import { Suspense } from "react";
import { PageLoadingState } from "@/components/common/PageLoadingState";
import { Article } from "@/components/ui/Article";
import { CursorList } from "@/components/ui/pagination/CursorList";
import { useArticlesCursor } from "@/features/articles/hooks";
import { useCursorPaginatedSearch } from "@/hooks/useCursorPaginatedSearch";
import { PublicArticleSearchParams } from "@/types/search-params";

const DEFAULT_LIMIT = 4;

interface CursorArticlesProps {
  searchParams?: PublicArticleSearchParams;
}

function ArticlesListContent({ searchParams }: CursorArticlesProps) {
  const {
    items: articles,
    hasNextPage,
    isLoading,
    isFetchingNextPage,
    emptyMessage,
    fetchNextPage,
  } = useCursorPaginatedSearch({
    searchParams,
    hook: useArticlesCursor,
    limit: DEFAULT_LIMIT,
    getEmptyMessage: (query) =>
      query
        ? `No articles found matching "${query}". Try a different search term.`
        : "No articles available.",
  });

  return (
    <CursorList
      items={articles}
      isLoading={isLoading}
      isFetchingNextPage={isFetchingNextPage}
      hasNextPage={hasNextPage}
      onLoadMore={() => fetchNextPage?.()}
      renderItem={(article) => <Article data={article} />}
      layout="flex"
      title="Cursor Articles"
      renderSkeleton={() => <PageLoadingState variant="card" />}
      emptyMessage={emptyMessage}
    />
  );
}

export function CursorArticles({ searchParams }: CursorArticlesProps) {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <ArticlesListContent searchParams={searchParams} />
    </Suspense>
  );
}
