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
  // Unified hook that handles both search and offset (new approach)
  hook?: (
    page: number,
    limit: number,
    query?: string,
    options?: any,
  ) => { data?: PaginatedResponse<T>; isLoading?: boolean };
  // Separate hooks for backwards compatibility
  searchHook?: (
    query: string,
    page: number,
    limit: number,
    options: any,
  ) => { data?: PaginatedResponse<T>; isLoading?: boolean };
  offsetHook?: (
    page: number,
    limit: number,
    options?: any,
  ) => { data?: PaginatedResponse<T>; isLoading?: boolean };
  limit: number;
  getEmptyMessage?: (query: string) => string;
}

export function usePaginatedSearch<T>({
  searchParams: initialSearchParams,
  hook,
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

  // Use unified hook if provided, otherwise use separate search/offset hooks
  let data: PaginatedResponse<T> | undefined;
  let isLoading: boolean | undefined;

  if (hook) {
    // Unified hook approach
    const result = hook(page, limit, query || undefined, filterOptions);
    data = result.data;
    isLoading = result.isLoading;
  } else {
    // Separate hooks approach (backwards compatibility)
    if (!searchHook || !offsetHook) {
      throw new Error(
        "Either provide 'hook' or both 'searchHook' and 'offsetHook'",
      );
    }

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

    data = query ? searchData : regularData;
    isLoading = query ? searchIsLoading : regularIsLoading;
  }

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

  // Build query params to pass to pagination - include all filter options
  const queryParams: Record<string, string | undefined> = {};
  if (query) queryParams.q = query;

  // Add all filter options to queryParams
  Object.entries(filterOptions).forEach(([key, value]) => {
    if (value) {
      queryParams[key] = String(value);
    }
  });

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
