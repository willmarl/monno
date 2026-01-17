import { fetcher } from "@/lib/fetcher";
import type {
  Post,
  CreatePostInput,
  UpdatePostInput,
  PostsList,
  PostListCursor,
} from "./types/post";

// GET /posts
export const fetchPosts = () => fetcher<PostsList>("/posts");

// GET /posts/:id
export const fetchPostById = (id: number) => fetcher<Post>(`/posts/${id}`);

// GET /posts/search?limit=5&offset=10
export const fetchPostsOffset = ({
  limit,
  offset,
}: {
  limit: number;
  offset: number;
}) =>
  fetcher<PostsList>("/posts", {
    searchParams: { limit, offset },
  });

// GET /posts/search/cursor?q=world&mode=all
export const fetchPostsCursor = ({
  limit,
  cursor,
}: {
  limit: number;
  cursor?: string | null;
}) =>
  fetcher<PostListCursor>("/posts/cursor", {
    searchParams: { limit, cursor: cursor ?? undefined },
  });

// GET /posts/search/cursor?query=world&limit=5&cursor=abc123
export const fetchPostsSearchCursor = ({
  query,
  limit,
  cursor,
  searchFields,
  sort,
  caseSensitive,
}: {
  query: string;
  limit: number;
  cursor?: string | null;
  searchFields?: string;
  sort?: string;
  caseSensitive?: boolean;
}) => {
  if (!query) return fetchPostsCursor({ limit, cursor });

  const searchParams: Record<string, string | number | boolean> = {
    query,
    limit,
  };
  if (cursor) searchParams.cursor = cursor;
  if (searchFields) searchParams.searchFields = searchFields;
  if (sort) searchParams.sort = sort;
  if (caseSensitive) searchParams.caseSensitive = caseSensitive;

  return fetcher<PostListCursor>("/posts/search/cursor", { searchParams });
};

// GET /posts/search?query=world&limit=5&offset=0
export const fetchPostsSearch = ({
  query,
  limit,
  offset,
  searchFields,
  sort,
  caseSensitive,
}: {
  query: string;
  limit: number;
  offset: number;
  searchFields?: string;
  sort?: string;
  caseSensitive?: boolean;
}) => {
  if (!query) return fetchPostsOffset({ limit, offset });

  const searchParams: Record<string, string | number | boolean> = {
    query,
    limit,
    offset,
  };
  if (searchFields) searchParams.searchFields = searchFields;
  if (sort) searchParams.sort = sort;
  if (caseSensitive) searchParams.caseSensitive = caseSensitive;

  return fetcher<PostsList>("/posts/search", { searchParams });
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
