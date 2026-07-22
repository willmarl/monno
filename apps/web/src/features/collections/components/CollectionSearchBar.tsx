"use client";

import { SearchBar } from "@/features/search/components/SearchBar";
import { SearchFilterDropdown } from "@/features/search/components/SearchFilterDropdown";
import { useCollectionSuggestions } from "@/features/collections/hooks";
import {
  collectionSearchFilters,
  collectionSearchSorts,
} from "@/features/collections/types/search-config";
import { Collection } from "../types/collection";

interface CollectionSearchBarProps {
  basePath?: string;
}

export function CollectionSearchBar({
  basePath = "/collections",
}: CollectionSearchBarProps) {
  return (
    <div className="flex gap-2">
      <SearchBar<Collection>
        placeholder="Search collections..."
        queryParam="q"
        basePath={basePath}
        useSuggestions={useCollectionSuggestions}
        renderSuggestion={(collection) => ({
          title: collection.name,
          subtitle: collection.description
            ? collection.description.substring(0, 60) + "..."
            : collection.creator.username,
        })}
        onNavigateTo={(collection) => `collection/${collection.id}`}
      />

      <SearchFilterDropdown
        filters={collectionSearchFilters}
        sorts={collectionSearchSorts}
        basePath={basePath}
      />
    </div>
  );
}
