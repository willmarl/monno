"use client";

import { useState } from "react";
import { usePostsByUserId } from "@/features/posts/hooks";
import { Post } from "@/components/ui/Post";
import { PaginatedListInline } from "@/components/ui/pagination/PaginatedListInline";
import { PublicUser } from "@/features/users/types/user";

interface UsersPostsListProps {
  user: PublicUser;
  isOwner: boolean;
}

const DEFAULT_LIMIT = 9;

export function UsersPostsList({ user, isOwner }: UsersPostsListProps) {
  const [page, setPage] = useState(1);

  const { data, isLoading } = usePostsByUserId(user.id, page, DEFAULT_LIMIT);

  const posts = data?.items ?? [];
  const totalItems = data?.pageInfo?.total ?? data?.pageInfo?.totalItems ?? 0;

  return (
    <PaginatedListInline
      page={page}
      limit={DEFAULT_LIMIT}
      items={posts}
      totalItems={totalItems}
      isLoading={isLoading}
      onPageChange={setPage}
      renderItem={(post) => <Post data={post} isOwner={isOwner} />}
      title={`Post's by ${user.username}`}
      layout="grid"
      emptyMessage="No posts yet."
    />
  );
}
