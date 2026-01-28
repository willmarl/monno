import type {
  SearchFieldOption,
  SearchFilterOption,
  SearchSortOption,
} from "@/features/search/types";

export const adminUserSearchFilters: SearchFilterOption[] = [
  {
    type: "checkbox",
    name: "searchFields",
    label: "Search In",
    options: [
      { value: "username", label: "Username" },
      { value: "email", label: "Email" },
    ],
  },
  {
    type: "checkbox",
    name: "roles",
    label: "Roles",
    options: [
      { value: "USER", label: "User" },
      { value: "ADMIN", label: "Admin" },
      { value: "MOD", label: "Moderator" },
    ],
  },
  {
    type: "checkbox",
    name: "statuses",
    label: "Status",
    options: [
      { value: "ACTIVE", label: "Active" },
      { value: "SUSPENDED", label: "Suspended" },
      { value: "BANNED", label: "Banned" },
      { value: "DELETED", label: "Deleted" },
    ],
  },
  {
    type: "toggle",
    name: "caseSensitive",
    label: "Case Sensitive",
  },
];

export const adminUserSearchSorts: SearchSortOption[] = [
  { value: "createdAt|desc", label: "Most Recent" },
  { value: "createdAt|asc", label: "Oldest" },
  { value: "updatedAt|desc", label: "Recently Updated" },
  { value: "updatedAt|asc", label: "Least Recently Updated" },
  // future:
  // { value: "likes|desc", label: "Most Liked" },
  // { value: "price|asc", label: "Lowest Price" },
];
