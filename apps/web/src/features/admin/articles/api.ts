import { fetcher } from "@/lib/fetcher";
import type {
  Article,
  ArticleMedia,
  ArticlesList,
  UpdateArticleInput,
} from "./types/article";

// GET /admin/articles?limit=10&offset=123
export const fetchAdminArticlesOffset = ({
  limit,
  offset,
}: {
  limit: number;
  offset: number;
}) =>
  fetcher<ArticlesList>("/admin/articles", {
    searchParams: { limit, offset },
  });

// GET /admin/articles?query=world&limit=5&offset=10
export const searchAdminArticlesOffset = ({
  query,
  limit = 10,
  offset = 0,
  searchFields,
  sort,
  caseSensitive,
  statuses,
  availability,
}: {
  query?: string;
  limit?: number;
  offset?: number;
  searchFields?: string;
  sort?: string;
  caseSensitive?: boolean;
  statuses?: string;
  availability?: string;
} = {}) => {
  const searchParams: Record<string, string | number | boolean> = {
    limit,
    offset,
  };
  if (query) searchParams.query = query;
  if (searchFields) searchParams.searchFields = searchFields;
  if (sort) searchParams.sort = sort;
  if (caseSensitive) searchParams.caseSensitive = caseSensitive;
  if (statuses) searchParams.statuses = statuses;
  if (availability) searchParams.availability = availability;

  return fetcher<ArticlesList>("/admin/articles", {
    searchParams,
  });
};

// GET /admin/articles/:id
export const fetchAdminArticleById = (id: number) =>
  fetcher<Article>(`/admin/articles/${id}`);

// PATCH /admin/articles/:id
export const updateAdminArticle = (id: number, data: UpdateArticleInput) =>
  fetcher<Article>(`/admin/articles/${id}`, { method: "PATCH", json: data });

// POST /admin/articles/:id/media
export const addAdminArticleMedia = (articleId: number, files: File[]) => {
  const body = new FormData();
  files.forEach((f) => body.append("files", f));
  return fetcher<ArticleMedia[]>(`/admin/articles/${articleId}/media`, { method: "POST", body });
};

// DELETE /admin/articles/:id/media/:mediaId
export const removeAdminArticleMedia = (articleId: number, mediaId: number) =>
  fetcher<void>(`/admin/articles/${articleId}/media/${mediaId}`, { method: "DELETE" });

// PATCH /admin/articles/:id/media/:mediaId/primary
export const setAdminArticleMediaPrimary = (articleId: number, mediaId: number) =>
  fetcher<void>(`/admin/articles/${articleId}/media/${mediaId}/primary`, { method: "PATCH" });

// PATCH /admin/articles/:id/media/reorder
export const reorderAdminArticleMedia = (articleId: number, ids: number[]) =>
  fetcher<void>(`/admin/articles/${articleId}/media/reorder`, { method: "PATCH", json: { ids } });

// DELETE /admin/articles/:id
export const deleteAdminArticle = (id: number) =>
  fetcher<void>(`/admin/articles/${id}`, {
    method: "DELETE",
  });

// POST /admin/articles/:id/restore
export const restoreAdminArticle = (id: number) =>
  fetcher<Article>(`/admin/articles/${id}/restore`, {
    method: "POST",
  });
