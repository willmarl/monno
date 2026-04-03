import type {
  SearchFieldOption,
  SearchFilterOption,
  SearchSortOption,
} from "@/features/search/types";

export const adminArticleSearchFilters: SearchFilterOption[] = [
  {
    type: "checkbox",
    name: "searchFields",
    label: "Search In",
    options: [
      { value: "title", label: "Title" },
      { value: "content", label: "Content" },
      { value: "creator.username", label: "Creator" },
    ],
  },
  {
    // filter if you want multi select enum
    type: "checkbox",
    name: "statuses",
    label: "Status",
    options: [
      { value: "DRAFT", label: "Draft" },
      { value: "PUBLISHED", label: "Published" },
      { value: "ARCHIVED", label: "Archived" },
      { value: "SCHEDULED", label: "Scheduled" },
    ],
  },
  // Alternative filter if you want single select enum
  // {
  //   type: "radio-combobox",
  //   name: "statuses",
  //   label: "Filter by status",
  //   options: [
  //     { value: "DRAFT", label: "Draft" },
  //     { value: "PUBLISHED", label: "Published" },
  //     { value: "ARCHIVED", label: "Archived" },
  //     { value: "SCHEDULED", label: "Scheduled" },
  //   ],
  // },
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
  {
    type: "radio-combobox",
    name: "availability",
    label: "Filter By Availability",
    options: [
      { value: "ALL", label: "All" },
      { value: "ACTIVE", label: "Active" },
      { value: "DELETED", label: "DELETED" },
    ],
  },
];

export const adminArticleSearchSorts: SearchSortOption[] = [
  { value: "createdAt|desc", label: "Most Recent" },
  { value: "createdAt|asc", label: "Oldest" },
  { value: "updatedAt|desc", label: "Recently Updated" },
  { value: "updatedAt|asc", label: "Least Recently Updated" },
];
