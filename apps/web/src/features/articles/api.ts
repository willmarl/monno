import { fetcher } from "@/lib/fetcher";
import type {
  Article,
  ArticlesList,
  ArticleListCursor,
  CreateArticleInput,
  UpdateArticleInput,
} from "./types/article";

// GET /articles?limit=10&offset=123
export const fetchArticlesOffset = ({
  limit,
  offset,
}: {
  limit: number;
  offset: number;
}) =>
  fetcher<ArticlesList>("/articles", {
    searchParams: { limit, offset },
  });

// GET /articles/cursor
export const fetchArticlesCursor = ({
  limit,
  cursor,
}: {
  limit: number;
  cursor?: string | null;
}) =>
  fetcher<ArticleListCursor>("/articles/cursor", {
    searchParams: { limit, cursor: cursor ?? undefined },
  });

// GET /articles/:id
export const fetchArticleById = (id: number) =>
  fetcher<Article>(`/articles/${id}`);

// GET /articles/users/:userId
export const fetchArticlesByUserId = (userId: number) =>
  fetcher<Article[]>(`/articles/users/${userId}`);

// POST /articles
export const createArticle = (data: CreateArticleInput) =>
  fetcher<Article>("/articles", {
    method: "POST",
    json: data,
  });

// PATCH /articles/:id
export const updateArticle = (id: number, data: UpdateArticleInput) =>
  fetcher<Article>(`/articles/${id}`, {
    method: "PATCH",
    json: data,
  });

// DELETE /articles/:id
export const deleteArticle = (id: number) =>
  fetcher<void>(`/articles/${id}`, {
    method: "DELETE",
  });

//==============
//   Admin
//==============

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

// GET /admin/articles/:id
export const fetchAdminArticleById = (id: number) =>
  fetcher<Article>(`/admin/articles/${id}`);

// PATCH /admin/articles/:id
export const updateAdminArticle = (id: number, data: UpdateArticleInput) =>
  fetcher<Article>(`/admin/articles/${id}`, {
    method: "PATCH",
    json: data,
  });

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
