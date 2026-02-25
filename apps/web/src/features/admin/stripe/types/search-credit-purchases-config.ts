import type {
  SearchFieldOption,
  SearchFilterOption,
  SearchSortOption,
} from "@/features/search/types";

export const creditPurchaseSearchFilters: SearchFilterOption[] = [
  {
    type: "checkbox",
    name: "searchFields",
    label: "Search In",
    options: [{ value: "user.username", label: "Username" }],
  },
  {
    type: "toggle",
    name: "caseSensitive",
    label: "Case Sensitive",
  },
];

export const creditPurchaseSearchSorts: SearchSortOption[] = [
  { value: "purchasedAt|desc", label: "Most Recent" },
  { value: "purchasedAt|asc", label: "Oldest" },
  { value: "amount|desc", label: "Highest Amount" },
  { value: "amount|asc", label: "Lowest Amount" },
  { value: "pricePaid|desc", label: "Highest Price" },
  { value: "pricePaid|asc", label: "Lowest Price" },
];
