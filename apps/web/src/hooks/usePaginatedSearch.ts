import { useEffect } from "react";
import { use } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface SearchParams {
  q?: string;
  searchFields?: string;
  sort?: string;
  page?: string;
  caseSensitive?: string;
  [key: string]: string | undefined;
}

interface PaginatedResponse<T> {
  items: T[];
  pageInfo: {
    totalItems: number;
  };
}

interface UsePaginatedSearchOptions<T> {
  searchParams?: SearchParams | Promise<SearchParams>;
  searchHook: (
    query: string,
    page: number,
    limit: number,
    options: any,
  ) => { data?: PaginatedResponse<T>; isLoading?: boolean };
  offsetHook: (
    page: number,
    limit: number,
    options?: any,
  ) => { data?: PaginatedResponse<T>; isLoading?: boolean };
  limit: number;
  getEmptyMessage?: (query: string) => string;
}

export function usePaginatedSearch<T>({
  searchParams: initialSearchParams,
  searchHook,
  offsetHook,
  limit,
  getEmptyMessage = (query) =>
    query
      ? `No results found matching "${query}". Try a different search term.`
      : "No results available.",
}: UsePaginatedSearchOptions<T>) {
  const router = useRouter();
  const urlSearchParams = useSearchParams();

  // Unwrap Promise if needed (Next.js 15+ searchParams)
  const resolvedSearchParams =
    initialSearchParams &&
    typeof initialSearchParams === "object" &&
    "then" in initialSearchParams
      ? use(initialSearchParams as Promise<SearchParams>)
      : (initialSearchParams ?? {});
  const searchParams = resolvedSearchParams as SearchParams;

  // Get page from query params
  const page = parseInt(
    searchParams?.page ?? urlSearchParams.get("page") ?? "1",
    10,
  );
  const query = searchParams?.q ?? urlSearchParams.get("q") ?? "";
  const searchFields =
    searchParams?.searchFields ??
    urlSearchParams.get("searchFields") ??
    undefined;
  const sort = searchParams?.sort ?? urlSearchParams.get("sort") ?? undefined;
  const caseSensitive =
    (searchParams?.caseSensitive ?? urlSearchParams.get("caseSensitive")) ===
    "true";

  // Collect all filter options from URL params (for things like roles, statuses, etc.)
  const filterOptions: Record<string, string | boolean | undefined> = {
    searchFields,
    sort,
    caseSensitive,
  };

  // Extract any additional filter params from URL (like roles, statuses)
  urlSearchParams.forEach((value, key) => {
    if (!["q", "page", "searchFields", "sort", "caseSensitive"].includes(key)) {
      filterOptions[key] = value;
    }
  });

  // Also add from searchParams object if present
  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => {
      if (
        !["q", "page", "searchFields", "sort", "caseSensitive"].includes(key) &&
        value
      ) {
        filterOptions[key] = value;
      }
    });
  }

  // Use search if query is present, otherwise use regular items
  const { data: searchData, isLoading: searchIsLoading } = searchHook(
    query,
    page,
    limit,
    filterOptions,
  );
  const { data: regularData, isLoading: regularIsLoading } = offsetHook(
    page,
    limit,
    filterOptions,
  );

  const data = query ? searchData : regularData;
  const isLoading = query ? searchIsLoading : regularIsLoading;

  const items: T[] = data?.items ?? [];
  const totalItems = data?.pageInfo?.totalItems ?? 0;
  const totalPages = Math.ceil(totalItems / limit);

  // Redirect to page 1 if current page exceeds total pages
  useEffect(() => {
    if (page > 1 && totalPages > 0 && page > totalPages) {
      const qs = new URLSearchParams(urlSearchParams.toString());
      qs.set("page", "1");
      router.push(`/?${qs.toString()}`);
    }
  }, [page, totalPages, urlSearchParams, router]);

  // Build query params to pass to pagination
  const queryParams: Record<string, string | undefined> = {};
  if (query) queryParams.q = query;
  if (searchFields) queryParams.searchFields = searchFields;
  if (sort) queryParams.sort = sort;
  if (caseSensitive) queryParams.caseSensitive = "true";

  const emptyMessage = getEmptyMessage(query);

  return {
    items,
    totalItems,
    totalPages,
    isLoading,
    queryParams,
    page,
    query,
    emptyMessage,
  };
}
