import { fetcher } from "@/lib/fetcher";
import type { Post, CreatePostInput, UpdatePostInput } from "./types/post";

// GET /posts
export const fetchPosts = () => fetcher<Post[]>("/posts");

// GET /posts/:id
export const fetchPostById = (id: string) => fetcher<Post>(`/posts/${id}`);

// POST /posts
export const createPost = (data: CreatePostInput) =>
  fetcher<Post>("/posts", {
    method: "POST",
    json: data,
  });

// PATCH /posts/:id
export const updatePost = (id: string, data: UpdatePostInput) =>
  fetcher<Post>(`/posts/${id}`, {
    method: "PATCH",
    json: data,
  });

// DELETE /posts/:id
export const deletePost = (id: string) =>
  fetcher<void>(`/posts/${id}`, {
    method: "DELETE",
  });
