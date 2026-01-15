"use client";

import { Suspense } from "react";
import { usePostsOffset, usePostsSearch } from "@/features/posts/hooks";
import { Post } from "@/components/ui/Post";
import { PaginatedList } from "@/components/ui/pagination/PaginatedList";
import { useSessionUser } from "@/features/auth/hooks";
import { usePaginatedSearch } from "@/hooks/usePaginatedSearch";
import { PostSkeleton } from "@/components/skeletons/PostSkeleton";

const DEFAULT_LIMIT = 4;

interface PaginatedPostsProps {
  searchParams?: {
    q?: string;
    searchFields?: string;
    sort?: string;
    page?: string;
    limit?: string;
    caseSensitive?: string;
  };
}

function PostsListContent({ searchParams }: PaginatedPostsProps) {
  const { data: user } = useSessionUser();

  const {
    items: posts,
    totalItems,
    isLoading,
    queryParams,
    emptyMessage,
    page,
  } = usePaginatedSearch({
    searchParams,
    searchHook: usePostsSearch,
    offsetHook: usePostsOffset,
    limit: DEFAULT_LIMIT,
    getEmptyMessage: (query) =>
      query
        ? `No posts found matching "${query}". Try a different search term.`
        : "No posts available.",
  });

  return (
    <PaginatedList
      url="post"
      page={page}
      limit={DEFAULT_LIMIT}
      items={posts}
      totalItems={totalItems}
      isLoading={isLoading}
      renderItem={(post) => (
        <Post data={post} isOwner={post.creator.id === user?.id} />
      )}
      renderSkeleton={() => <PostSkeleton />}
      title="Posts"
      layout="flex"
      queryParams={queryParams}
      emptyMessage={emptyMessage}
    />
  );
}

export function PaginatedPosts({ searchParams }: PaginatedPostsProps) {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <PostsListContent searchParams={searchParams} />
    </Suspense>
  );
}
