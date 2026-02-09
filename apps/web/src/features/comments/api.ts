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

//==============
//   Admin
//==============

// GET /admin/comments?query=world&limit=5&offset=0&deleted=true&resourceType=POST
export const fetchAdminComments = ({
  query,
  limit = 10,
  offset = 0,
  searchFields,
  sort,
  caseSensitive,
  deleted,
  resourceType,
}: {
  query?: string;
  limit?: number;
  offset?: number;
  searchFields?: string;
  sort?: string;
  caseSensitive?: boolean;
  deleted?: boolean;
  resourceType?: string;
} = {}) => {
  const searchParams: Record<string, string | number | boolean> = {
    limit,
    offset,
  };
  if (query) searchParams.query = query;
  if (searchFields) searchParams.searchFields = searchFields;
  if (sort) searchParams.sort = sort;
  if (caseSensitive) searchParams.caseSensitive = caseSensitive;
  if (deleted !== undefined) searchParams.deleted = deleted;
  if (resourceType) searchParams.resourceType = resourceType;

  return fetcher<CommentsList>("/admin/comments", { searchParams });
};

// GET /admin/comments/:id
export const fetchAdminCommentById = (id: number) =>
  fetcher<Comment>(`/admin/comments/${id}`);

// DELETE /admin/comments/:id
export const deleteAdminComment = (id: number) =>
  fetcher<void>(`/admin/comments/${id}`, {
    method: "DELETE",
  });

// POST /admin/comments/:id/restore
export const restoreAdminComment = (id: number) =>
  fetcher<Comment>(`/admin/comments/${id}/restore`, {
    method: "POST",
  });
