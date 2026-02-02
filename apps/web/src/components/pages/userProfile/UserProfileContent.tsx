"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { usePostsByUserId } from "@/features/posts/hooks";
import { Post } from "@/components/ui/Post";
import { PaginatedList } from "@/components/ui/pagination/PaginatedList";
import { LikedPostsList } from "./LikedPostsList";
import { PublicUser } from "@/features/users/types/user";

interface UserProfileContentProps {
  user: PublicUser;
  isOwner: boolean;
}

const DEFAULT_LIMIT = 9;

function PostsListContent({ user, isOwner }: UserProfileContentProps) {
  const searchParams = useSearchParams();

  // Get page from query params
  const page = parseInt(searchParams.get("page") ?? "1", 10);

  const { data, isLoading } = usePostsByUserId(user.id, page, DEFAULT_LIMIT);

  const posts = data?.items ?? [];
  const totalItems = data?.pageInfo?.totalItems ?? 0;

  return (
    <PaginatedList
      url={"user/" + user.username}
      page={page}
      limit={DEFAULT_LIMIT}
      items={posts}
      totalItems={totalItems}
      isLoading={isLoading}
      renderItem={(post) => <Post data={post} isOwner={isOwner} />}
      title={"Posts by " + user.username}
      layout="grid"
    />
  );
}

export function UserProfileContent({ user, isOwner }: UserProfileContentProps) {
  return (
    <div className="space-y-8">
      <Suspense fallback={<p>Loading...</p>}>
        <PostsListContent user={user} isOwner={isOwner} />
      </Suspense>
      <Suspense fallback={<p>Loading...</p>}>
        <LikedPostsList user={user} isOwner={isOwner} />
      </Suspense>
    </div>
  );
}
