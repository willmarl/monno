import type {
  SearchFieldOption,
  SearchFilterOption,
  SearchSortOption,
} from "@/features/search/types";

export const ticketSearchFilters: SearchFilterOption[] = [
  {
    type: "checkbox",
    name: "searchFields",
    label: "Search In",
    options: [
      { value: "title", label: "Title" },
      { value: "message", label: "Message" },
      { value: "adminNotes", label: "Notes" },
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
      { value: "OPEN", label: "Open" },
      { value: "RESPONDED", label: "Responded" },
      { value: "CLOSED", label: "Closed" },
    ],
  },
];

export const ticketSearchSorts: SearchSortOption[] = [
  { value: "createdAt|desc", label: "Most Recent" },
  { value: "createdAt|asc", label: "Oldest" },
  { value: "updatedAt|desc", label: "Recently Updated" },
  { value: "updatedAt|asc", label: "Least Recently Updated" },
];
