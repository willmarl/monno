"use client";

import { Suspense } from "react";
import { usePostsCursor } from "@/features/posts/hooks";
import { Post as PostComponent } from "@/components/ui/Post";
import { CursorPaginatedList } from "@/components/ui/pagination/CursorPaginatedList";
import { useSessionUser } from "@/features/auth/hooks";
import { useCursorPaginatedSearch } from "@/hooks/useCursorPaginatedSearch";
// import { PostSkeleton } from "@/components/skeletons/PostSkeleton";
import { Post } from "@/features/posts/types/post";

const DEFAULT_LIMIT = 20;

interface CursorPostsContentProps {
  searchParams?: {
    q?: string;
    searchFields?: string;
    sort?: string;
    caseSensitive?: string;
  };
}

function PostsListContent({ searchParams }: CursorPostsContentProps) {
  const { data: user } = useSessionUser();

  const {
    items: posts,
    hasNextPage,
    isLoading,
    isFetchingNextPage,
    queryParams,
    emptyMessage,
    fetchNextPage,
  } = useCursorPaginatedSearch<Post>({
    searchParams,
    hook: usePostsCursor,
    limit: DEFAULT_LIMIT,
    getEmptyMessage: (query) =>
      query
        ? `No posts found matching "${query}". Try a different search term.`
        : "No posts available.",
  });

  return (
    <CursorPaginatedList
      items={posts}
      hasNextPage={hasNextPage}
      isLoading={isLoading}
      variant="infinite"
      isFetchingNextPage={isFetchingNextPage}
      onLoadMore={() => fetchNextPage?.()}
      renderItem={(post) => (
        <PostComponent data={post} isOwner={post.creator.id === user?.id} />
      )}
      // renderSkeleton={() => <PostSkeleton />}
      title="Posts (Cursor Pagination)"
      layout="flex"
      emptyMessage={emptyMessage}
    />
  );
}

export function CursorPostsContent({ searchParams }: CursorPostsContentProps) {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <PostsListContent searchParams={searchParams} />
    </Suspense>
  );
}
