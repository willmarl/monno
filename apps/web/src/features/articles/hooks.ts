import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useInfiniteQuery } from "@tanstack/react-query"; // only if using cursor
import {
  createArticle,
  fetchArticleById,
  fetchArticlesOffset,
  fetchArticlesCursor,
  fetchArticlesByUserId,
  updateArticle,
  deleteArticle,
  fetchAdminArticlesOffset,
  fetchAdminArticleById,
  updateAdminArticle,
  deleteAdminArticle,
  restoreAdminArticle,
} from "./api";

export function useArticlesOffset(page: number, limit: number) {
  const offset = (page - 1) * limit;

  return useQuery({
    queryKey: ["articles-offset", page],
    queryFn: () => fetchArticlesOffset({ limit, offset }),
  });
}

export function useArticlesCursor(limit: number = 10) {
  return useInfiniteQuery({
    queryKey: ["articles-cursor"],
    queryFn: ({ pageParam }) =>
      fetchArticlesCursor({
        limit,
        cursor: pageParam ?? null,
      }),

    // pageParam = nextCursor from backend
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: null as string | null,
  });
}

export function useArticleById(id: number) {
  return useQuery({
    queryKey: ["article", id],
    queryFn: () => fetchArticleById(id),
    enabled: !!id,
  });
}

export function useArticlesByUserId(userId: number) {
  return useQuery({
    queryKey: ["articles-by-user", userId],
    queryFn: () => fetchArticlesByUserId(userId),
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

//==============
//   Admin
//==============

export function useAdminArticlesOffset(page: number, limit: number) {
  const offset = (page - 1) * limit;

  return useQuery({
    queryKey: ["articles-offset", page],
    queryFn: () => fetchAdminArticlesOffset({ limit, offset }),
  });
}

export function useAdminArticleById(id: number) {
  return useQuery({
    queryKey: ["admin-article", id],
    queryFn: () => fetchAdminArticleById(id),
    enabled: !!id,
  });
}

export function useAdminUpdateArticle() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: Parameters<typeof updateAdminArticle>[1];
    }) => updateAdminArticle(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ["admin-articles"] });
      qc.invalidateQueries({ queryKey: ["admin-article", id] });
    },
    throwOnError: false,
  });
}

export function useAdminDeleteArticle() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: deleteAdminArticle,
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ["admin-articles"] });
      qc.removeQueries({ queryKey: ["admin-article", id] });
    },
    throwOnError: false,
  });
}

export function useAdminRestoreArticle() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: restoreAdminArticle,
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ["admin-articles"] });
      qc.invalidateQueries({ queryKey: ["admin-article", id] });
    },
    throwOnError: false,
  });
}
