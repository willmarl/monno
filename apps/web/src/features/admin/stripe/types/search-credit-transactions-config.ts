import type {
  SearchFieldOption,
  SearchFilterOption,
  SearchSortOption,
} from "@/features/search/types";

export const creditTransactionSearchFilters: SearchFilterOption[] = [
  {
    type: "checkbox",
    name: "searchFields",
    label: "Search In",
    options: [
      { value: "reason", label: "Reason" },
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
    name: "type",
    label: "Filter by type",
    options: [
      { value: "PURCHASE", label: "Purchase" },
      { value: "SPEND", label: "Spend" },
      { value: "REFUND", label: "Refund" },
      { value: "ADMIN_ADJUST", label: "Admin Adjust" },
    ],
  },
];

export const creditTransactionSearchSorts: SearchSortOption[] = [
  { value: "createdAt|desc", label: "Most Recent" },
  { value: "createdAt|asc", label: "Oldest" },
  { value: "amount|desc", label: "Highest Amount" },
  { value: "amount|asc", label: "Lowest Amount" },
];
