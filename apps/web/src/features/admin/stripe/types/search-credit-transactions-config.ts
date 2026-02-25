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
      { value: "type", label: "Type" },
      { value: "reason", label: "Reason" },
      { value: "user.username", label: "Username" },
    ],
  },
  {
    type: "toggle",
    name: "caseSensitive",
    label: "Case Sensitive",
  },
];

export const creditTransactionSearchSorts: SearchSortOption[] = [
  { value: "createdAt|desc", label: "Most Recent" },
  { value: "createdAt|asc", label: "Oldest" },
  { value: "amount|desc", label: "Highest Amount" },
  { value: "amount|asc", label: "Lowest Amount" },
];
