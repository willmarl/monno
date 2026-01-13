"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { usePostsOffset } from "@/features/posts/hooks";
import { Post } from "@/components/ui/Post";
import { PaginatedList } from "@/components/ui/pagination/PaginatedList";
import { useSessionUser } from "@/features/auth/hooks";

const DEFAULT_LIMIT = 4;

function PostsListContent() {
  const { data: user } = useSessionUser();

  const searchParams = useSearchParams();

  // Get page from query params
  const page = parseInt(searchParams.get("page") ?? "1", 10);

  const { data, isLoading } = usePostsOffset(page, DEFAULT_LIMIT);

  const posts = data?.items ?? [];
  const totalItems = data?.pageInfo?.totalItems ?? 0;

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
      title="Posts"
      layout="flex"
    />
  );
}

export function PaginatedPosts() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <PostsListContent />
    </Suspense>
  );
}
