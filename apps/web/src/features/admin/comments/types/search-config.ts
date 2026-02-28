import type {
  SearchFieldOption,
  SearchFilterOption,
  SearchSortOption,
} from "@/features/search/types";

export const adminCommentSearchFilters: SearchFilterOption[] = [
  {
    type: "checkbox",
    name: "searchFields",
    label: "Search In",
    options: [
      { value: "content", label: "Content" },
      { value: "creator.username", label: "Creator" },
    ],
  },
  {
    type: "radio",
    name: "resourceType",
    label: "Filter by resource",
    options: [
      { value: "POST", label: "Post" },
      { value: "COMMENT", label: "Comment" },
      // { value: "VIDEO", label: "Video" },
    ],
  },
  {
    type: "toggle",
    name: "caseSensitive",
    label: "Case Sensitive",
  },
  {
    type: "toggle",
    name: "deleted",
    label: "Deleted",
  },
  // future: tags, price ranges, etc.
];

export const adminCommentSearchSorts: SearchSortOption[] = [
  { value: "createdAt|desc", label: "Most Recent" },
  { value: "createdAt|asc", label: "Oldest" },
  { value: "updatedAt|desc", label: "Recently Updated" },
  { value: "updatedAt|asc", label: "Least Recently Updated" },
  { value: "likes|desc", label: "Most Liked" },
  { value: "likes|asc", label: "Least Liked" },
];
