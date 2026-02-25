"use client";

import { SearchBar } from "@/features/search/components/SearchBar";
import { SearchFilterDropdown } from "@/features/search/components/SearchFilterDropdown";
import {
  subscriptionSearchFilters,
  subscriptionSearchSorts,
} from "@/features/admin/stripe/types/search-subscriptions-config";
import { Subscription } from "@/features/stripe/types/stripe";

interface SubscriptionSearchBarProps {
  basePath?: string;
}

export function SubscriptionSearchBar({
  basePath = "/admin/subscription",
}: SubscriptionSearchBarProps) {
  return (
    <div className="flex gap-2">
      <SearchBar<Subscription>
        placeholder="Search subscriptions..."
        queryParam="q"
        basePath={basePath}
      />

      <SearchFilterDropdown
        filters={subscriptionSearchFilters}
        sorts={subscriptionSearchSorts}
        basePath={basePath}
      />
    </div>
  );
}
