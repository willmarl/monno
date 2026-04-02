import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useInfiniteQuery } from "@tanstack/react-query"; // only if using cursor
import {
  createArticle,
  fetchArticleById,
  fetchArticlesOffset,
  fetchArticlesCursor,
  searchArticlesOffset,
  searchArticlesCursor,
  fetchArticleSuggestions,
  fetchArticlesByUserId,
  fetchArticlesByUserIdCursor,
  updateArticle,
  deleteArticle,
} from "./api";

// commented out as its redundant now. replaced by search
// export function useArticlesOffset(page: number, limit: number) {
//   const offset = (page - 1) * limit;

//   return useQuery({
//     queryKey: ["articles", page],
//     queryFn: () => fetchArticlesOffset({ limit, offset }),
//   });
// }

export function useArticlesOffset(
  page: number = 1,
  limit: number = 10,
  query?: string,
  options?: {
    searchFields?: string;
    sort?: string;
    caseSensitive?: boolean;
    statuses?: string;
    [key: string]: any;
  },
) {
  const offset = (page - 1) * limit;

  return useQuery({
    queryKey: [
      "articles",
      page,
      query,
      options?.searchFields,
      options?.sort,
      options?.caseSensitive,
      options?.statuses,
    ],
    queryFn: () =>
      searchArticlesOffset({
        query,
        limit,
        offset,
        searchFields: options?.searchFields,
        sort: options?.sort,
        caseSensitive: options?.caseSensitive,
        statuses: options?.statuses,
      }),
  });
}

// commented out as its redundant now. replaced by search
// export function useArticlesCursor(limit: number = 10) {
//   return useInfiniteQuery({
//     queryKey: ["articles"],
//     queryFn: ({ pageParam }) =>
//       fetchArticlesCursor({
//         limit,
//         cursor: pageParam ?? null,
//       }),

//     // pageParam = nextCursor from backend
//     getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
//     initialPageParam: null as string | null,
//   });
// }

export function useArticlesCursor(
  limit: number = 10,
  query?: string,
  options?: {
    searchFields?: string;
    sort?: string;
    caseSensitive?: boolean;
    statuses?: string;
    [key: string]: any;
  },
) {
  return useInfiniteQuery({
    queryKey: [
      "articles",
      query,
      options?.searchFields,
      options?.sort,
      options?.caseSensitive,
      options?.statuses,
    ],
    queryFn: ({ pageParam }) =>
      searchArticlesCursor({
        query,
        limit,
        cursor: pageParam ?? null,
        searchFields: options?.searchFields,
        sort: options?.sort,
        caseSensitive: options?.caseSensitive,
        statuses: options?.statuses,
      }),

    // pageParam = nextCursor from backend
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: null as string | null,
  });
}

export function useArticleSuggestions(q: string, limit: number = 5) {
  return useQuery({
    queryKey: ["article-suggestions", q],
    queryFn: () => fetchArticleSuggestions(q, limit),
    enabled: !!q,
  });
}

export function useArticleById(id: number) {
  return useQuery({
    queryKey: ["article", id],
    queryFn: () => fetchArticleById(id),
    enabled: !!id,
  });
}

export function useArticlesByUserId(
  userId: number,
  page: number,
  limit: number,
) {
  const offset = (page - 1) * limit;

  return useQuery({
    queryKey: ["articles-by-user", userId, page],
    queryFn: () => fetchArticlesByUserId({ userId, limit, offset }),
    enabled: !!userId,
  });
}

export function useArticlesByUserIdCursor(userId: number, limit: number = 10) {
  return useInfiniteQuery({
    queryKey: ["articles-by-user-cursor", userId],
    queryFn: ({ pageParam }) =>
      fetchArticlesByUserIdCursor({
        userId,
        limit,
        cursor: pageParam ?? null,
      }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: null as string | null,
    enabled: !!userId,
  });
}

export function useCreateArticle() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: createArticle,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["articles"] });
    },
    throwOnError: false, // Don't throw errors, let component handle them
  });
}

export function useUpdateArticle() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: Parameters<typeof updateArticle>[1];
    }) => updateArticle(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ["articles"] });
      qc.invalidateQueries({ queryKey: ["article", id] });
    },
    throwOnError: false, // Don't throw errors, let component handle them
  });
}

export function useDeleteArticle() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: deleteArticle,
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ["articles"] });
      qc.removeQueries({ queryKey: ["article", id] });
    },
    throwOnError: false, // Don't throw errors, let component handle them
  });
}
