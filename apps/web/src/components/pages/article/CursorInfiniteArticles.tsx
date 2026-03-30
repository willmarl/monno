"use client";

import { PageLoadingState } from "@/components/common/PageLoadingState";
import { Article } from "@/components/ui/Article";
import { CursorInfiniteList } from "@/components/ui/pagination/CursorInfiniteList";
import { useArticlesCursor } from "@/features/articles/hooks";
import { useSessionUser } from "@/features/auth/hooks";

const DEFAULT_LIMIT = 4;

export function CursorInfiniteArticles() {
  const { data: user } = useSessionUser();

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useArticlesCursor(DEFAULT_LIMIT);

  const articles = data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <CursorInfiniteList
      items={articles}
      isLoading={isLoading}
      isFetchingNextPage={isFetchingNextPage}
      hasNextPage={hasNextPage}
      onLoadMore={() => fetchNextPage()}
      renderItem={(article) => (
        <Article data={article} isOwner={article.creator.id === user?.id} />
      )}
      layout="flex"
      title="Infinite Articles"
      renderSkeleton={() => <PageLoadingState variant="card" />}
    />
  );
}
