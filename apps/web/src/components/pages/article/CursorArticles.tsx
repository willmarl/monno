"use client";

import { PageLoadingState } from "@/components/common/PageLoadingState";
import { Article } from "@/components/ui/Article";
import { CursorList } from "@/components/ui/pagination/CursorList";
import { useArticlesCursor } from "@/features/articles/hooks";
import { useSessionUser } from "@/features/auth/hooks";

const DEFAULT_LIMIT = 4;

export function CursorArticles() {
  const { data: user } = useSessionUser();

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useArticlesCursor(DEFAULT_LIMIT);

  const articles = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <CursorList
      items={articles}
      isLoading={isLoading}
      isFetchingNextPage={isFetchingNextPage}
      hasNextPage={hasNextPage}
      onLoadMore={() => fetchNextPage()}
      renderItem={(article) => (
        <Article data={article} isOwner={article.creator.id === user?.id} />
      )}
      layout="flex"
      title="Cursor Articles"
      renderSkeleton={() => <PageLoadingState variant="card" />}
    />
  );
}
