import type {
  SearchFieldOption,
  SearchFilterOption,
  SearchSortOption,
} from "@/features/search/types";

export const postSearchFilters: SearchFilterOption[] = [
  {
    type: "checkbox",
    name: "searchIn",
    label: "Search In",
    options: [
      { value: "title", label: "Title" },
      { value: "content", label: "Content" },
      { value: "owner", label: "Owner" },
    ],
  },
  // future: tags, price ranges, etc.
];

export const postSearchSorts: SearchSortOption[] = [
  { value: "createdAt|desc", label: "Most Recent" },
  { value: "createdAt|asc", label: "Oldest" },
  { value: "updatedAt|desc", label: "Recently Updated" },
  { value: "updatedAt|asc", label: "Least Recently Updated" },
  // future:
  // { value: "likes|desc", label: "Most Liked" },
  // { value: "price|asc", label: "Lowest Price" },
];
