"use client";

import { SearchBar } from "@/features/search/components/SearchBar";
import { SearchFilterDropdown } from "@/features/search/components/SearchFilterDropdown";
import {
  creditTransactionSearchFilters,
  creditTransactionSearchSorts,
} from "@/features/admin/stripe/types/search-credit-transactions-config";
import { CreditTransaction } from "@/features/stripe/types/stripe";

interface CreditTransactionSearchBarProps {
  basePath?: string;
}

export function CreditTransactionSearchBar({
  basePath = "/admin/credit-transactions",
}: CreditTransactionSearchBarProps) {
  return (
    <div className="flex gap-2">
      <SearchBar<CreditTransaction>
        placeholder="Search credit transactions..."
        queryParam="q"
        basePath={basePath}
      />

      <SearchFilterDropdown
        filters={creditTransactionSearchFilters}
        sorts={creditTransactionSearchSorts}
        basePath={basePath}
      />
    </div>
  );
}
