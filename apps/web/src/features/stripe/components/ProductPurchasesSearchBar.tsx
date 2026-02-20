"use client";

import { SearchBar } from "@/features/search/components/SearchBar";
import { SearchFilterDropdown } from "@/features/search/components/SearchFilterDropdown";
import {
  productSearchFilters,
  productSearchSorts,
} from "@/features/stripe/types/search-product-purchases-config";
import { ProductPurchase } from "../types/stripe";

interface ProductPurchaseSearchBarProps {
  basePath?: string;
}

export function ProductPurchaseSearchBar({
  basePath = "/admin/products-purchased",
}: ProductPurchaseSearchBarProps) {
  return (
    <div className="flex gap-2">
      <SearchBar<ProductPurchase>
        placeholder="Search products..."
        queryParam="q"
        basePath={basePath}
      />

      <SearchFilterDropdown
        filters={productSearchFilters}
        sorts={productSearchSorts}
        basePath={basePath}
      />
    </div>
  );
}
