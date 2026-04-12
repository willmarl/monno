import { fetcher } from "@/lib/fetcher";
import { toFormData } from "@/lib/utils/form-data";
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

// GET /articles?query=world&limit=5&offset=10
export const searchArticlesOffset = ({
  query,
  limit = 10,
  offset = 0,
  searchFields,
  sort,
  caseSensitive,
  statuses,
}: {
  query?: string;
  limit?: number;
  offset?: number;
  searchFields?: string;
  sort?: string;
  caseSensitive?: boolean;
  statuses?: string;
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

  return fetcher<ArticlesList>("/articles", {
    searchParams,
  });
};

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

// GET /articles/cursor?query=world&limit=5&cursor=abc123
export const searchArticlesCursor = ({
  query,
  limit,
  cursor,
  searchFields,
  sort,
  caseSensitive,
  statuses,
}: {
  query?: string;
  limit: number;
  cursor?: string | null;
  searchFields?: string;
  sort?: string;
  caseSensitive?: boolean;
  statuses?: string;
}) => {
  const searchParams: Record<string, string | number | boolean> = {
    limit,
  };
  if (query) searchParams.query = query;
  if (cursor) searchParams.cursor = cursor;
  if (searchFields) searchParams.searchFields = searchFields;
  if (sort) searchParams.sort = sort;
  if (caseSensitive) searchParams.caseSensitive = caseSensitive;
  if (statuses) searchParams.statuses = statuses;

  return fetcher<ArticleListCursor>("/articles/cursor", { searchParams });
};

// GET /articles/search/suggest?q=hello&limit=5
export const fetchArticleSuggestions = (q: string, limit: number = 5) => {
  if (!q) return Promise.resolve([]);

  return fetcher<Article[]>("/articles/search/suggest", {
    searchParams: { q, limit },
  });
};

// GET /articles/:id
export const fetchArticleById = (id: number) =>
  fetcher<Article>(`/articles/${id}`);

// GET /articles/users/:userId?limit=10&offset=0
export const fetchArticlesByUserId = ({
  userId,
  limit,
  offset,
}: {
  userId: number;
  limit: number;
  offset: number;
}) =>
  fetcher<ArticlesList>(`/articles/users/${userId}`, {
    searchParams: { limit, offset },
  });

// GET /articles/users/:userId/cursor?limit=10&cursor=abc123
export const fetchArticlesByUserIdCursor = ({
  userId,
  limit,
  cursor,
}: {
  userId: number;
  limit: number;
  cursor?: string | null;
}) =>
  fetcher<ArticleListCursor>(`/articles/users/${userId}/cursor`, {
    searchParams: { limit, cursor: cursor ?? undefined },
  });

// POST /articles
export const createArticle = (data: CreateArticleInput, file?: File) => {
  // Use FormData if file is provided, otherwise JSON
  if (file) {
    return fetcher<Article>("/articles", {
      method: "POST",
      body: toFormData(data, file),
    });
  }

  return fetcher<Article>("/articles", {
    method: "POST",
    json: data,
  });
};

// PATCH /articles/:id
export const updateArticle = (
  id: number,
  data: UpdateArticleInput,
  file?: File,
) => {
  // Use FormData if file is provided, otherwise JSON
  if (file) {
    return fetcher<Article>(`/articles/${id}`, {
      method: "PATCH",
      body: toFormData(data, file),
    });
  }

  return fetcher<Article>(`/articles/${id}`, {
    method: "PATCH",
    json: data,
  });
};

// DELETE /articles/:id
export const deleteArticle = (id: number) =>
  fetcher<void>(`/articles/${id}`, {
    method: "DELETE",
  });

// GET /articles/liked/:userId?limit=10&offset=0
export const fetchArticleLikedByUser = ({
  userId,
  limit,
  offset,
}: {
  userId: number;
  limit: number;
  offset: number;
}) =>
  fetcher<ArticlesList>(`/articles/users/${userId}/liked`, {
    searchParams: { limit, offset },
  });

// GET /articles/liked/:userId/cursor?limit=10&cursor=abc123
export const fetchArticleLikedByUserCursor = ({
  userId,
  limit,
  cursor,
}: {
  userId: number;
  limit: number;
  cursor?: string | null;
}) =>
  fetcher<ArticleListCursor>(`/articles/users/${userId}/liked/cursor`, {
    searchParams: { limit, cursor: cursor ?? undefined },
  });
