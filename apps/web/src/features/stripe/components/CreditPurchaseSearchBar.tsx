"use client";

import { SearchBar } from "@/features/search/components/SearchBar";
import { SearchFilterDropdown } from "@/features/search/components/SearchFilterDropdown";
import {
  creditPurchaseSearchFilters,
  creditPurchaseSearchSorts,
} from "@/features/stripe/types/search-credit-purchases-config";
import { CreditPurchase } from "../types/stripe";

interface CreditPurchaseSearchBarProps {
  basePath?: string;
}

export function CreditPurchaseSearchBar({
  basePath = "/admin/credit-purchases",
}: CreditPurchaseSearchBarProps) {
  return (
    <div className="flex gap-2">
      <SearchBar<CreditPurchase>
        placeholder="Search credit purchases..."
        queryParam="q"
        basePath={basePath}
      />

      <SearchFilterDropdown
        filters={creditPurchaseSearchFilters}
        sorts={creditPurchaseSearchSorts}
        basePath={basePath}
      />
    </div>
  );
}
