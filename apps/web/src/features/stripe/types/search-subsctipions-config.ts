import type {
  SearchFieldOption,
  SearchFilterOption,
  SearchSortOption,
} from "@/features/search/types";

export const subscriptionSearchFilters: SearchFilterOption[] = [
  {
    type: "checkbox",
    name: "searchFields",
    label: "Search In",
    options: [
      { value: "tier", label: "Tier" },
      { value: "status", label: "Status" },
      { value: "userId.username", label: "Username" },
    ],
  },
  {
    type: "toggle",
    name: "caseSensitive",
    label: "Case Sensitive",
  },
];

export const subscriptionSearchSorts: SearchSortOption[] = [
  { value: "createdAt|desc", label: "Most Recent" },
  { value: "createdAt|asc", label: "Oldest" },
  { value: "updatedAt|desc", label: "Recently Updated" },
  { value: "updatedAt|asc", label: "Least Recently Updated" },
];
