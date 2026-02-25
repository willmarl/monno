export type SearchFieldOption = {
  value: string;
  label: string;
};

export type SearchSortOption = {
  value: string;
  label: string;
};

export type SearchFilterOption = {
  type: "checkbox" | "radio" | "toggle" | "radio-combobox";
  name: string;
  label: string;
  options?: Array<{ value: string; label: string }>;
};
