import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchAdminArticlesOffset,
  searchAdminArticlesOffset,
  fetchAdminArticleById,
  updateAdminArticle,
  deleteAdminArticle,
  restoreAdminArticle,
  addAdminArticleMedia,
  removeAdminArticleMedia,
  setAdminArticleMediaPrimary,
  reorderAdminArticleMedia,
} from "./api";

// commented out as its redundant now. replaced by search
// export function useAdminArticlesOffset(page: number, limit: number) {
//   const offset = (page - 1) * limit;

//   return useQuery({
//     queryKey: ["admin-articles", page],
//     queryFn: () => fetchAdminArticlesOffset({ limit, offset }),
//   });
// }

export function useAdminArticlesOffset(
  page: number = 1,
  limit: number = 10,
  query?: string,
  options?: {
    searchFields?: string;
    sort?: string;
    caseSensitive?: boolean;
    statuses?: string;
    availability?: string;
    [key: string]: any;
  },
) {
  const offset = (page - 1) * limit;

  return useQuery({
    queryKey: [
      "admin-articles",
      page,
      query,
      options?.searchFields,
      options?.sort,
      options?.caseSensitive,
      options?.statuses,
      options?.availability,
    ],
    queryFn: () =>
      searchAdminArticlesOffset({
        query,
        limit,
        offset,
        searchFields: options?.searchFields,
        sort: options?.sort,
        caseSensitive: options?.caseSensitive,
        statuses: options?.statuses,
        availability: options?.availability,
      }),
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
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof updateAdminArticle>[1] }) =>
      updateAdminArticle(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ["admin-articles"] });
      qc.invalidateQueries({ queryKey: ["admin-article", id] });
    },
    throwOnError: false,
  });
}

export function useAddAdminArticleMedia(articleId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (files: File[]) => addAdminArticleMedia(articleId, files),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-article", articleId] });
      qc.invalidateQueries({ queryKey: ["admin-articles"] });
    },
  });
}

export function useRemoveAdminArticleMedia(articleId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (mediaId: number) => removeAdminArticleMedia(articleId, mediaId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-article", articleId] });
      qc.invalidateQueries({ queryKey: ["admin-articles"] });
    },
  });
}

export function useSetAdminArticleMediaPrimary(articleId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (mediaId: number) => setAdminArticleMediaPrimary(articleId, mediaId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-article", articleId] }),
  });
}

export function useReorderAdminArticleMedia(articleId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: number[]) => reorderAdminArticleMedia(articleId, ids),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-article", articleId] }),
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
