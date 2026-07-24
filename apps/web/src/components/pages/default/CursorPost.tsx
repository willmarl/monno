"use client";

import { Post } from "@/components/ui/Post";
import { CursorList } from "@/components/ui/pagination/CursorList";
import { usePostsCursor } from "@/features/posts/hooks";

const DEFAULT_LIMIT = 20;

export function CursorPost() {
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    usePostsCursor(DEFAULT_LIMIT);

  const posts = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <CursorList
      items={posts}
      isLoading={isLoading}
      isFetchingNextPage={isFetchingNextPage}
      hasNextPage={hasNextPage}
      onLoadMore={() => fetchNextPage()}
      renderItem={(post) => <Post data={post} />}
      layout="flex"
      title="Cursor Posts"
    />
  );
}
