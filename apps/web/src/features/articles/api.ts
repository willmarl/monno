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
