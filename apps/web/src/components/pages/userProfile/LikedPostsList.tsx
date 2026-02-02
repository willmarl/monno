"use client";

import { useState } from "react";
import { useLikedByUser } from "@/features/posts/hooks";
import { Post } from "@/components/ui/Post";
import { PaginationControlsInline } from "@/components/ui/pagination/PaginationControlsInline";
import { PublicUser } from "@/features/users/types/user";

interface LikedPostsListProps {
  user: PublicUser;
  isOwner: boolean;
}

const DEFAULT_LIMIT = 9;

export function LikedPostsList({ user, isOwner }: LikedPostsListProps) {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useLikedByUser(user.id, page, DEFAULT_LIMIT);

  const posts = data?.items ?? [];
  const totalItems = data?.pageInfo?.total ?? 0;
  const totalPages = Math.ceil(totalItems / DEFAULT_LIMIT);

  const containerClassName =
    "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10";

  if (isLoading && posts.length === 0) {
    return <p>Loading...</p>;
  }

  if (posts.length === 0) {
    return (
      <div className="space-y-8">
        <h1 className="text-3xl font-bold">{`${user.username}'s Liked Posts`}</h1>
        <div className="text-center text-muted-foreground py-12">
          <p>No liked posts yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">{`${user.username}'s Liked Posts`}</h1>

      <div className={containerClassName}>
        {posts.map((post) => (
          <div key={post.id}>
            <Post data={post} isOwner={isOwner} />
          </div>
        ))}
      </div>

      <PaginationControlsInline
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />
    </div>
  );
}
