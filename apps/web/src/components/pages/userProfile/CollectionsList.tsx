"use client";

import { useState } from "react";
import { useCollectionsByUserId } from "@/features/collections/hooks";
import { CollectionCard } from "@/components/ui/Collection";
import { PaginatedListInline } from "@/components/ui/pagination/PaginatedListInline";
import { PublicUser } from "@/features/users/types/user";

interface CollectionsListProps {
  user: PublicUser;
  isOwner: boolean;
}

const DEFAULT_LIMIT = 9;

export function CollectionsList({ user, isOwner }: CollectionsListProps) {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useCollectionsByUserId(
    user.id,
    page,
    DEFAULT_LIMIT,
  );

  const collections = data?.items ?? [];
  const totalItems = data?.pageInfo?.total ?? data?.pageInfo?.totalItems ?? 0;

  return (
    <PaginatedListInline
      page={page}
      limit={DEFAULT_LIMIT}
      items={collections}
      totalItems={totalItems}
      isLoading={isLoading}
      onPageChange={setPage}
      renderItem={(collection) => (
        <CollectionCard data={collection} isOwner={isOwner} />
      )}
      title={`Collections by ${user.username}`}
      layout="custom"
      gridClassName="flex gap-4"
      emptyMessage="No collections yet."
    />
  );
}
