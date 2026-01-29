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
  // Unified hook that handles both search and cursor (new approach)
  hook?: (
    limit: number,
    query?: string,
    options?: any,
  ) => {
    data?: { pages?: CursorResponse<T>[] };
    hasNextPage?: boolean;
    isFetching?: boolean;
    isFetchingNextPage?: boolean;
    fetchNextPage?: () => void;
  };
  // Separate hooks for backwards compatibility
  searchHook?: (
    query: string,
    limit: number,
    options: any,
  ) => {
    data?: { pages?: CursorResponse<T>[] };
    hasNextPage?: boolean;
    isFetching?: boolean;
    isFetchingNextPage?: boolean;
    fetchNextPage?: () => void;
  };
  cursorHook?: (limit: number) => {
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
  hook,
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
      : (initialSearchParams ?? {});
  const searchParams = resolvedSearchParams as SearchParams;

  const query = searchParams?.q ?? "";
  const searchFields = searchParams?.searchFields ?? undefined;
  const sort = searchParams?.sort ?? undefined;
  const caseSensitive = searchParams?.caseSensitive === "true";

  // Use unified hook if provided, otherwise use separate search/cursor hooks
  let result;

  if (hook) {
    // Unified hook approach
    result = hook(limit, query || undefined, {
      searchFields,
      sort,
      caseSensitive,
    });
  } else {
    // Separate hooks approach (backwards compatibility)
    if (!searchHook || !cursorHook) {
      throw new Error(
        "Either provide 'hook' or both 'searchHook' and 'cursorHook'",
      );
    }

    const searchResult = searchHook(query, limit, {
      searchFields,
      sort,
      caseSensitive,
    });
    const cursorResult = cursorHook(limit);

    result = query ? searchResult : cursorResult;
  }

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
