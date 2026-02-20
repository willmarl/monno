import type {
  SearchFieldOption,
  SearchFilterOption,
  SearchSortOption,
} from "@/features/search/types";

export const productSearchFilters: SearchFilterOption[] = [
  {
    type: "checkbox",
    name: "searchFields",
    label: "Search In",
    options: [
      { value: "productId", label: "Product ID" },
      { value: "status", label: "Status" },
      { value: "user.username", label: "Username" },
    ],
  },
  {
    type: "toggle",
    name: "caseSensitive",
    label: "Case Sensitive",
  },
];

export const productSearchSorts: SearchSortOption[] = [
  { value: "purchasedAt|desc", label: "Most Recently Purchased" },
  { value: "purchasedAt|asc", label: "Oldest Purchased" },
  { value: "refundedAt|desc", label: "Most Recently Refunded" },
  { value: "refundedAt|asc", label: "Oldest Refunded" },
];
