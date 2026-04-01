"use client";

import { useState } from "react";
import { useArticlesByUserId } from "@/features/articles/hooks";
import { Article } from "@/components/ui/Article";
import { PaginatedListInline } from "@/components/ui/pagination/PaginatedListInline";
import { PublicUser } from "@/features/users/types/user";

interface UsersArticlesListProps {
  user: PublicUser;
  isOwner: boolean;
}

const DEFAULT_LIMIT = 9;

export function UsersArticlesList({ user, isOwner }: UsersArticlesListProps) {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useArticlesByUserId(user.id, page, DEFAULT_LIMIT);

  const articles = data?.items ?? [];
  const totalItems = data?.pageInfo?.total ?? data?.pageInfo?.totalItems ?? 0;

  return (
    <PaginatedListInline
      page={page}
      limit={DEFAULT_LIMIT}
      items={articles}
      totalItems={totalItems}
      isLoading={isLoading}
      onPageChange={setPage}
      renderItem={(article) => <Article data={article} isOwner={isOwner} />}
      title={`Articles by ${user.username}`}
      layout="grid"
      emptyMessage="No articles yet."
    />
  );
}
