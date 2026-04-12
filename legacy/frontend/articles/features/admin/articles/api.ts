import { fetcher } from "@/lib/fetcher";
import { toFormData } from "@/lib/utils/form-data";
import type {
  Article,
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
export const updateAdminArticle = (
  id: number,
  data: UpdateArticleInput,
  file?: File,
) => {
  // Use FormData if file is provided, otherwise JSON
  if (file) {
    return fetcher<Article>(`/admin/articles/${id}`, {
      method: "PATCH",
      body: toFormData(data, file),
    });
  }

  return fetcher<Article>(`/admin/articles/${id}`, {
    method: "PATCH",
    json: data,
  });
};

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
