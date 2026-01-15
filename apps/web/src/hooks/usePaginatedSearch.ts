import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface SearchParams {
  q?: string;
  searchFields?: string;
  sort?: string;
  page?: string;
  caseSensitive?: string;
}

interface PaginatedResponse<T> {
  items: T[];
  pageInfo: {
    totalItems: number;
  };
}

interface UsePaginatedSearchOptions<T> {
  searchParams?: SearchParams;
  searchHook: (
    query: string,
    page: number,
    limit: number,
    options: any
  ) => { data?: PaginatedResponse<T>; isLoading?: boolean };
  offsetHook: (
    page: number,
    limit: number
  ) => { data?: PaginatedResponse<T>; isLoading?: boolean };
  limit: number;
  getEmptyMessage?: (query: string) => string;
}

export function usePaginatedSearch<T>({
  searchParams,
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

  // Get page from query params
  const page = parseInt(
    searchParams?.page ?? urlSearchParams.get("page") ?? "1",
    10
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

  // Use search if query is present, otherwise use regular items
  const { data: searchData, isLoading: searchIsLoading } = searchHook(
    query,
    page,
    limit,
    { searchFields, sort, caseSensitive }
  );
  const { data: regularData, isLoading: regularIsLoading } = offsetHook(
    page,
    limit
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
