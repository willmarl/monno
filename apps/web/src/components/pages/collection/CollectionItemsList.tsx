"use client";

import { useState } from "react";
import { useCollectionById } from "@/features/collections/hooks";
import { CollectionItem } from "@/components/ui/CollectionItem";
import { PaginatedListInline } from "@/components/ui/pagination/PaginatedListInline";
import { CollectionCreator } from "@/features/collections/types/collection";

interface CollectionItemsListProps {
  collectionId: number;
  creator: CollectionCreator;
  isOwner: boolean;
}

const DEFAULT_LIMIT = 9;

export function CollectionItemsList({
  collectionId,
  creator,
  isOwner,
}: CollectionItemsListProps) {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useCollectionById(
    collectionId,
    page,
    DEFAULT_LIMIT,
  );

  const collectionitems = data?.items ?? [];
  const totalItems = data?.itemsPageInfo?.total ?? 0;

  return (
    <PaginatedListInline
      page={page}
      limit={DEFAULT_LIMIT}
      items={collectionitems}
      totalItems={totalItems}
      isLoading={isLoading}
      onPageChange={setPage}
      renderItem={(collectionitem) => (
        <CollectionItem item={collectionitem} isOwner={isOwner} />
      )}
      title={`Items by ${creator.username}`}
      layout="grid"
      emptyMessage="No items in collection yet."
    />
  );
}
