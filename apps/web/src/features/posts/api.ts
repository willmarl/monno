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
