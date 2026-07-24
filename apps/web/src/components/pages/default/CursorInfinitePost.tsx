"use client";

import { Post } from "@/components/ui/Post";
import { CursorInfiniteList } from "@/components/ui/pagination/CursorInfiniteList";
import { usePostsCursor } from "@/features/posts/hooks";

const DEFAULT_LIMIT = 20;

export function CursorInfinitePost() {
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
      renderItem={(post) => <Post data={post} />}
      layout="flex"
      title="Infinite Posts"
    />
  );
}
