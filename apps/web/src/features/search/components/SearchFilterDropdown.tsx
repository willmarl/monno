"use client";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Filter, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { SearchFilterOption, SearchSortOption } from "../types";
import { SearchFilterCheckbox } from "./SearchFilterCheckbox";
import { SearchFilterRadio } from "./SearchFilterRadio";
import { SearchFilterRadioCombobox } from "./SearchFilterRadioCombobox";
import { SearchFilterToggle } from "./SearchFilterToggle";
import { SearchSortSection } from "./SearchSortSection";

export function SearchFilterDropdown({
  filters,
  sorts = [],
  basePath = "/search",
}: {
  filters: SearchFilterOption[];
  sorts?: SearchSortOption[];
  basePath?: string;
}) {
  const router = useRouter();
  const params = useSearchParams();

  const hasActiveFilters =
    filters.some((f) => params.has(f.name)) || params.has("sort");

  function clearAllFilters() {
    const qs = new URLSearchParams(params.toString());
    // Remove all filter and sort params
    filters.forEach((f) => qs.delete(f.name));
    qs.delete("sort");
    router.push(`${basePath}?${qs.toString()}`);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Filters
          {hasActiveFilters && (
            <span className="ml-2 inline-block h-2 w-2 rounded-full bg-blue-500" />
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-64">
        <DropdownMenuLabel>Filters</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Render filter groups */}
        {filters.map((filter) =>
          filter.type === "checkbox" ? (
            <SearchFilterCheckbox
              key={filter.name}
              filter={filter}
              basePath={basePath}
            />
          ) : filter.type === "radio" ? (
            <SearchFilterRadio
              key={filter.name}
              filter={filter}
              basePath={basePath}
            />
          ) : filter.type === "radio-combobox" ? (
            <SearchFilterRadioCombobox
              key={filter.name}
              filter={filter}
              basePath={basePath}
            />
          ) : (
            <SearchFilterToggle
              key={filter.name}
              filter={filter}
              basePath={basePath}
            />
          ),
        )}

        {/* Add sort section only if sorts exist */}
        {sorts.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <SearchSortSection sorts={sorts} basePath={basePath} />
          </>
        )}

        {/* Clear filters button */}
        {hasActiveFilters && (
          <>
            <DropdownMenuSeparator />
            <div className="p-3">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-destructive hover:text-destructive"
                onClick={clearAllFilters}
              >
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
