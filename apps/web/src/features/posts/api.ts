import { fetcher } from "@/lib/fetcher";
import type {
  Post,
  CreatePostInput,
  UpdatePostInput,
  PostsList,
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
