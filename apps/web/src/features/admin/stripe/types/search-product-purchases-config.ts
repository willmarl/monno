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
      { value: "user.username", label: "Username" },
    ],
  },
  {
    type: "toggle",
    name: "caseSensitive",
    label: "Case Sensitive",
  },
  {
    type: "radio-combobox",
    name: "status",
    label: "Filter by status",
    options: [
      { value: "ACTIVE", label: "Active" },
      { value: "REFUNDED", label: "Refunded" },
    ],
  },
];

export const productSearchSorts: SearchSortOption[] = [
  { value: "purchasedAt|desc", label: "Most Recently Purchased" },
  { value: "purchasedAt|asc", label: "Oldest Purchased" },
  { value: "refundedAt|desc", label: "Most Recently Refunded" },
  { value: "refundedAt|asc", label: "Oldest Refunded" },
];
