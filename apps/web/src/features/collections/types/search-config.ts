import type { SearchFilterOption, SearchSortOption } from "@/features/search/types";

export const collectionSearchFilters: SearchFilterOption[] = [
  {
    type: "checkbox",
    name: "searchFields",
    label: "Search In",
    options: [
      { value: "name", label: "Name" },
      { value: "description", label: "Description" },
      { value: "creator.username", label: "Creator" },
    ],
  },
  {
    type: "toggle",
    name: "caseSensitive",
    label: "Case Sensitive",
  },
];

export const collectionSearchSorts: SearchSortOption[] = [
  { value: "createdAt|desc", label: "Most Recent" },
  { value: "createdAt|asc", label: "Oldest" },
  { value: "updatedAt|desc", label: "Recently Updated" },
  { value: "likeCount|desc", label: "Most Liked" },
];
