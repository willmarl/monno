"use client";

import { useState } from "react";
import { useLikedByUser } from "@/features/posts/hooks";
import { Post } from "@/components/ui/Post";
import { PaginatedListInline } from "@/components/ui/pagination/PaginatedListInline";
import { PublicUser } from "@/features/users/types/user";
import { ProfileListSearch } from "./ProfileListSearch";

interface LikedPostsListProps {
  user: PublicUser;
}

const DEFAULT_LIMIT = 9;

export function LikedPostsList({ user }: LikedPostsListProps) {
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");

  const { data, isLoading } = useLikedByUser(
    user.id,
    page,
    DEFAULT_LIMIT,
    query,
  );

  const posts = data?.items ?? [];
  const totalItems = data?.pageInfo?.total ?? data?.pageInfo?.totalItems ?? 0;

  return (
    <div>
      <ProfileListSearch
        placeholder="Search liked posts…"
        value={query}
        onChange={(q) => {
          setQuery(q);
          setPage(1);
        }}
      />
      <PaginatedListInline
        page={page}
        limit={DEFAULT_LIMIT}
        items={posts}
        totalItems={totalItems}
        isLoading={isLoading}
        onPageChange={setPage}
        renderItem={(post) => <Post data={post} />}
        title={`Liked Posts by ${user.username}`}
        layout="grid"
        emptyMessage={
          query ? `No liked posts matching "${query}".` : "No liked posts yet."
        }
      />
    </div>
  );
}
