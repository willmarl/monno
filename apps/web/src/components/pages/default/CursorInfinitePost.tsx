"use client";

import { Post } from "@/components/ui/Post";
import { CursorInfiniteList } from "@/components/ui/pagination/CursorInfiniteList";
import { usePostsCursor } from "@/features/posts/hooks";
import { useSessionUser } from "@/features/auth/hooks";

const DEFAULT_LIMIT = 4;

export function CursorInfinitePost() {
  const { data: user } = useSessionUser();

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    usePostsCursor(DEFAULT_LIMIT);

  const posts = data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <CursorInfiniteList
      items={posts}
      isLoading={isLoading}
      isFetchingNextPage={isFetchingNextPage}
      hasNextPage={hasNextPage}
      onLoadMore={() => fetchNextPage()}
      renderItem={(post) => (
        <Post data={post} isOwner={post.creator.id === user?.id} />
      )}
      layout="flex"
      title="Infinite Posts"
    />
  );
}
