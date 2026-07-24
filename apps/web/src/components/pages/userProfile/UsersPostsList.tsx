"use client";

import { useState } from "react";
import { usePostsByUserId } from "@/features/posts/hooks";
import { Post } from "@/components/ui/Post";
import { PaginatedListInline } from "@/components/ui/pagination/PaginatedListInline";
import { PublicUser } from "@/features/users/types/user";
import { ProfileListSearch } from "./ProfileListSearch";

interface UsersPostsListProps {
  user: PublicUser;
}

const DEFAULT_LIMIT = 9;

export function UsersPostsList({ user }: UsersPostsListProps) {
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");

  const { data, isLoading } = usePostsByUserId(
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
        placeholder={`Search posts by ${user.username}…`}
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
        title={`Posts by ${user.username}`}
        layout="grid"
        emptyMessage={
          query ? `No posts matching "${query}".` : "No posts yet."
        }
      />
    </div>
  );
}
