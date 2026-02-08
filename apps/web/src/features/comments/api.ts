import { fetcher } from "@/lib/fetcher";
import type {
  Comment,
  CommentsList,
  CommentInput,
  UpdateCommentInput,
} from "./types/comment";

// create comment on a resource
export const createComment = (data: CommentInput) =>
  fetcher<Comment>("/comments", {
    method: "POST",
    json: data,
  });

// get all comments for a resource (post, video, article, comment, etc.)
export const fetchCommentsByResource = (
  resourceType: string,
  resourceId: number,
  limit: number = 10,
  offset: number = 0,
) =>
  fetcher<CommentsList>(`/comments/resource/${resourceType}/${resourceId}`, {
    searchParams: { limit, offset },
  });

// get a specific comment
export const fetchCommentById = (id: number) =>
  fetcher<Comment>(`/comments/${id}`);

// update comment
export const updateComment = (id: number, data: UpdateCommentInput) =>
  fetcher<Comment>(`/comments/${id}`, {
    method: "PATCH",
    json: data,
  });

// delete comment
export const deleteComment = (id: number) =>
  fetcher<void>(`/comments/${id}`, {
    method: "DELETE",
  });
