"use client";

import { CollectionSearchBar } from "@/features/collections/components/CollectionSearchBar";
import { SearchTabs } from "@/components/common/SearchTabs";
import { PaginatedCollections } from "./PaginatedCollections";
import { PublicCollectionSearchParams } from "@/types/search-params";

interface CollectionsBrowsePageProps {
  searchParams?: PublicCollectionSearchParams;
}

export function CollectionsBrowsePage({
  searchParams,
}: CollectionsBrowsePageProps) {
  return (
    <div>
      <div className="flex flex-col items-center gap-4 mb-4">
        <SearchTabs activeTab="collections" />
        <div className="flex flex-col md:flex-row w-full md:w-auto gap-2 md:gap-4 px-4 md:px-0">
          <CollectionSearchBar basePath="/collections" />
        </div>
      </div>
      <PaginatedCollections searchParams={searchParams} />
    </div>
  );
}
