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
    options: [{ value: "userId.username", label: "Username" }],
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
      { value: "CANCELED", label: "Canceled" },
      { value: "PAST_DUE", label: "Past Due" },
      { value: "TRIALING", label: "Trialing" },
    ],
  },
  {
    type: "radio-combobox",
    name: "tier",
    label: "Filter by tier",
    options: [
      { value: "FREE", label: "Free" },
      { value: "BASIC", label: "Basic" },
      { value: "PRO", label: "Pro" },
    ],
  },
];

export const subscriptionSearchSorts: SearchSortOption[] = [
  { value: "createdAt|desc", label: "Most Recent" },
  { value: "createdAt|asc", label: "Oldest" },
  { value: "updatedAt|desc", label: "Recently Updated" },
  { value: "updatedAt|asc", label: "Least Recently Updated" },
];
