"use client";

import { useState } from "react";
import { useArticleLikedByUser } from "@/features/articles/hooks";
import { Article } from "@/components/ui/Article";
import { PaginatedListInline } from "@/components/ui/pagination/PaginatedListInline";
import { PublicUser } from "@/features/users/types/user";
import { ProfileListSearch } from "./ProfileListSearch";

interface LikedArticlesListProps {
  user: PublicUser;
  isOwner: boolean;
}

const DEFAULT_LIMIT = 9;

export function LikedArticlesList({ user, isOwner }: LikedArticlesListProps) {
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");

  const { data, isLoading } = useArticleLikedByUser(
    user.id,
    page,
    DEFAULT_LIMIT,
    query,
  );

  const articles = data?.items ?? [];
  const totalItems = data?.pageInfo?.total ?? data?.pageInfo?.totalItems ?? 0;

  return (
    <div>
      <ProfileListSearch
        placeholder="Search liked articles…"
        value={query}
        onChange={(q) => {
          setQuery(q);
          setPage(1);
        }}
      />
      <PaginatedListInline
        page={page}
        limit={DEFAULT_LIMIT}
        items={articles}
        totalItems={totalItems}
        isLoading={isLoading}
        onPageChange={setPage}
        renderItem={(article) => <Article data={article} isOwner={isOwner} />}
        title={`Liked Articles by ${user.username}`}
        layout="grid"
        emptyMessage={
          query
            ? `No liked articles matching "${query}".`
            : "No liked articles yet."
        }
      />
    </div>
  );
}
