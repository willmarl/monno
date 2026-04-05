"use client";

import { useState } from "react";
import { useCommentsByResource } from "@/features/comments/hooks";
import { Comment } from "@/components/ui/Comment";
import { PaginatedListInline } from "@/components/ui/pagination/PaginatedListInline";
import { useSessionUser } from "@/features/auth/hooks";
import type { ResourceType } from "@/types/resource";

interface CommentsListProps {
  resourceType: ResourceType;
  resourceId: number;
}

const DEFAULT_LIMIT = 20;

export function CommentPagInline({
  resourceType,
  resourceId,
}: CommentsListProps) {
  const { data: currentUser } = useSessionUser();

  const [page, setPage] = useState(1);

  const { data, isLoading } = useCommentsByResource(
    resourceType,
    resourceId,
    page,
    DEFAULT_LIMIT,
  );

  const comments = data?.items ?? [];
  const totalItems = data?.pageInfo?.total ?? data?.pageInfo?.totalItems ?? 0;

  return (
    <PaginatedListInline
      page={page}
      limit={DEFAULT_LIMIT}
      items={comments}
      totalItems={totalItems}
      isLoading={isLoading}
      onPageChange={setPage}
      renderItem={(comment) => (
        <Comment
          data={comment}
          isOwner={currentUser?.id == comment.creator.id}
        />
      )}
      layout="flex"
      emptyMessage="No comments yet."
    />
  );
}
