"use client";

import { Suspense } from "react";
import { useCollections } from "@/features/collections/hooks";
import { CollectionCard } from "@/components/ui/Collection";
import { PaginatedList } from "@/components/ui/pagination/PaginatedList";
import { useSessionUser } from "@/features/auth/hooks";
import { usePaginatedSearch } from "@/hooks/usePaginatedSearch";
import { PublicCollectionSearchParams } from "@/types/search-params";

const DEFAULT_LIMIT = 9;

interface PaginatedCollectionsProps {
  searchParams?: PublicCollectionSearchParams;
}

function CollectionsListContent({ searchParams }: PaginatedCollectionsProps) {
  const { data: user } = useSessionUser();

  const {
    items: collections,
    totalItems,
    isLoading,
    queryParams,
    emptyMessage,
    page,
  } = usePaginatedSearch({
    searchParams,
    hook: useCollections,
    limit: DEFAULT_LIMIT,
    getEmptyMessage: (query) =>
      query
        ? `No public collections matching "${query}".`
        : "No public collections yet.",
  });

  return (
    <PaginatedList
      url="collections"
      page={page}
      limit={DEFAULT_LIMIT}
      items={collections}
      totalItems={totalItems}
      isLoading={isLoading}
      renderItem={(collection) => (
        <CollectionCard
          data={collection}
          isOwner={collection.creator.id === user?.id}
        />
      )}
      title="Collections"
      layout="grid"
      queryParams={queryParams}
      emptyMessage={emptyMessage}
    />
  );
}

export function PaginatedCollections({
  searchParams,
}: PaginatedCollectionsProps) {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <CollectionsListContent searchParams={searchParams} />
    </Suspense>
  );
}
