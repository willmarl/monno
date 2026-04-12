"use client";

import { Suspense } from "react";
import { PageLoadingState } from "@/components/common/PageLoadingState";
import { Article } from "@/components/ui/Article";
import { CursorInfiniteList } from "@/components/ui/pagination/CursorInfiniteList";
import { useArticlesCursor } from "@/features/articles/hooks";
import { useSessionUser } from "@/features/auth/hooks";
import { useCursorPaginatedSearch } from "@/hooks/useCursorPaginatedSearch";
import { PublicArticleSearchParams } from "@/types/search-params";

const DEFAULT_LIMIT = 4;

interface CursorInfiniteArticlesProps {
  searchParams?: PublicArticleSearchParams;
}

function ArticlesListContent({ searchParams }: CursorInfiniteArticlesProps) {
  const { data: user } = useSessionUser();

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
    <CursorInfiniteList
      items={articles}
      isLoading={isLoading}
      isFetchingNextPage={isFetchingNextPage}
      hasNextPage={hasNextPage}
      onLoadMore={() => fetchNextPage?.()}
      renderItem={(article) => (
        <Article data={article} isOwner={article.creator.id === user?.id} />
      )}
      layout="flex"
      title="Infinite Articles"
      renderSkeleton={() => <PageLoadingState variant="card" />}
      emptyMessage={emptyMessage}
    />
  );
}

export function CursorInfiniteArticles({
  searchParams,
}: CursorInfiniteArticlesProps) {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <ArticlesListContent searchParams={searchParams} />
    </Suspense>
  );
}
