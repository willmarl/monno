"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useArticlesOffset } from "@/features/articles/hooks";
import { Article } from "@/components/ui/Article";
import { PaginatedList } from "@/components/ui/pagination/PaginatedList";
import { useSessionUser } from "@/features/auth/hooks";
import { PageLoadingState } from "@/components/common/PageLoadingState";

const DEFAULT_LIMIT = 4;

function ArticlesListContent() {
  const { data: user } = useSessionUser();

  const searchParams = useSearchParams();

  // Get page from query params
  const page = parseInt(searchParams.get("page") ?? "1", 10);

  const { data, isLoading } = useArticlesOffset(page, DEFAULT_LIMIT);

  const articles = data?.items ?? [];
  const totalItems = data?.pageInfo?.totalItems ?? 0;

  return (
    <PaginatedList
      url="article"
      page={page}
      limit={DEFAULT_LIMIT}
      items={articles}
      totalItems={totalItems}
      isLoading={isLoading}
      renderItem={(articles) => (
        <Article data={articles} isOwner={articles.creator.id === user?.id} />
      )}
      title="Articles"
      layout="flex"
      renderSkeleton={() => <PageLoadingState variant="card" />}
    />
  );
}

export function PaginatedArticles() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <ArticlesListContent />
    </Suspense>
  );
}
