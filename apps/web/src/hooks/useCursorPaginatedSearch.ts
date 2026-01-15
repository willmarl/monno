import { useEffect } from "react";
import { use } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface SearchParams {
  q?: string;
  searchFields?: string;
  sort?: string;
  caseSensitive?: string;
}

interface CursorResponse<T> {
  items: T[];
  nextCursor?: string;
}

interface UseCursorPaginatedSearchOptions<T> {
  searchParams?: SearchParams | Promise<SearchParams>;
  searchHook: (
    query: string,
    limit: number,
    options: any
  ) => {
    data?: { pages?: CursorResponse<T>[] };
    hasNextPage?: boolean;
    isFetching?: boolean;
    isFetchingNextPage?: boolean;
    fetchNextPage?: () => void;
  };
  cursorHook: (limit: number) => {
    data?: { pages?: CursorResponse<T>[] };
    hasNextPage?: boolean;
    isFetching?: boolean;
    isFetchingNextPage?: boolean;
    fetchNextPage?: () => void;
  };
  limit: number;
  getEmptyMessage?: (query: string) => string;
}

export function useCursorPaginatedSearch<T>({
  searchParams: initialSearchParams,
  searchHook,
  cursorHook,
  limit,
  getEmptyMessage = (query) =>
    query
      ? `No results found matching "${query}". Try a different search term.`
      : "No results available.",
}: UseCursorPaginatedSearchOptions<T>) {
  // Unwrap Promise if needed (Next.js 15+ searchParams)
  const resolvedSearchParams =
    initialSearchParams &&
    typeof initialSearchParams === "object" &&
    "then" in initialSearchParams
      ? use(initialSearchParams as Promise<SearchParams>)
      : initialSearchParams ?? {};
  const searchParams = resolvedSearchParams as SearchParams;

  const query = searchParams?.q ?? "";
  const searchFields = searchParams?.searchFields ?? undefined;
  const sort = searchParams?.sort ?? undefined;
  const caseSensitive = searchParams?.caseSensitive === "true";

  // Use search if query is present, otherwise use regular cursor pagination
  const searchResult = searchHook(query, limit, {
    searchFields,
    sort,
    caseSensitive,
  });
  const cursorResult = cursorHook(limit);

  const result = query ? searchResult : cursorResult;

  // Flatten pages into single array of items
  const items: T[] =
    result.data?.pages?.flatMap((page) => page.items ?? []) ?? [];
  const hasNextPage = result.hasNextPage ?? false;
  const isLoading = result.isFetching ?? false;
  const isFetchingNextPage = result.isFetchingNextPage ?? false;

  // Build query params to pass to pagination
  const queryParams: Record<string, string | undefined> = {};
  if (query) queryParams.q = query;
  if (searchFields) queryParams.searchFields = searchFields;
  if (sort) queryParams.sort = sort;
  if (caseSensitive) queryParams.caseSensitive = "true";

  const emptyMessage = getEmptyMessage(query);

  return {
    items,
    hasNextPage,
    isLoading,
    isFetchingNextPage,
    queryParams,
    query,
    emptyMessage,
    fetchNextPage: result.fetchNextPage,
  };
}
