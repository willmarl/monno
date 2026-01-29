import { fetcher } from "@/lib/fetcher";
import type {
  Post,
  CreatePostInput,
  UpdatePostInput,
  PostsList,
  PostListCursor,
} from "./types/post";

// GET /posts/:id
export const fetchPostById = (id: number) => fetcher<Post>(`/posts/${id}`);

// GET /posts?query=world&limit=5&offset=0
export const fetchPosts = ({
  query,
  limit = 10,
  offset = 0,
  searchFields,
  sort,
  caseSensitive,
}: {
  query?: string;
  limit?: number;
  offset?: number;
  searchFields?: string;
  sort?: string;
  caseSensitive?: boolean;
} = {}) => {
  const searchParams: Record<string, string | number | boolean> = {
    limit,
    offset,
  };
  if (query) searchParams.query = query;
  if (searchFields) searchParams.searchFields = searchFields;
  if (sort) searchParams.sort = sort;
  if (caseSensitive) searchParams.caseSensitive = caseSensitive;

  return fetcher<PostsList>("/posts", { searchParams });
};

// GET /posts/cursor?query=world&limit=5&cursor=abc123
export const fetchPostsCursor = ({
  query,
  limit,
  cursor,
  searchFields,
  sort,
  caseSensitive,
}: {
  query?: string;
  limit: number;
  cursor?: string | null;
  searchFields?: string;
  sort?: string;
  caseSensitive?: boolean;
}) => {
  const searchParams: Record<string, string | number | boolean> = {
    limit,
  };
  if (query) searchParams.query = query;
  if (cursor) searchParams.cursor = cursor;
  if (searchFields) searchParams.searchFields = searchFields;
  if (sort) searchParams.sort = sort;
  if (caseSensitive) searchParams.caseSensitive = caseSensitive;

  return fetcher<PostListCursor>("/posts/cursor", { searchParams });
};

// GET /posts/search/suggest?q=world&limit=5
export const fetchPostSuggestions = (q: string, limit: number = 5) => {
  if (!q) return Promise.resolve([]);

  return fetcher<Post[]>("/posts/search/suggest", {
    searchParams: { q, limit },
  });
};

// GET /posts/users/:userId?limit=10&offset=0
export const fetchPostsByUserId = ({
  userId,
  limit,
  offset,
}: {
  userId: number;
  limit: number;
  offset: number;
}) =>
  fetcher<PostsList>(`/posts/users/${userId}`, {
    searchParams: { limit, offset },
  });

// GET /posts/users/:userId/cursor?limit=10&cursor=abc123
export const fetchPostsByUserIdCursor = ({
  userId,
  limit,
  cursor,
}: {
  userId: number;
  limit: number;
  cursor?: string | null;
}) =>
  fetcher<PostListCursor>(`/posts/users/${userId}/cursor`, {
    searchParams: { limit, cursor: cursor ?? undefined },
  });

// POST /posts
export const createPost = (data: CreatePostInput) =>
  fetcher<Post>("/posts", {
    method: "POST",
    json: data,
  });

// PATCH /posts/:id
export const updatePost = (id: number, data: UpdatePostInput) =>
  fetcher<Post>(`/posts/${id}`, {
    method: "PATCH",
    json: data,
  });

// DELETE /posts/:id
export const deletePost = (id: number) =>
  fetcher<void>(`/posts/${id}`, {
    method: "DELETE",
  });
