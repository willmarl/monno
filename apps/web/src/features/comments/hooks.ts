import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { CommentInput, UpdateCommentInput } from "./types/comment";
import {
  createComment,
  fetchCommentsByResource,
  fetchCommentById,
  updateComment,
  deleteComment,
} from "./api";

/**
 * Get all comments for a resource (post, video, article, comment, etc.)
 */
export function useCommentsByResource(
  resourceType: string,
  resourceId: number,
  page: number = 1,
  limit: number = 10,
) {
  const offset = (page - 1) * limit;
  return useQuery({
    queryKey: ["comments-resource", resourceType, resourceId, page, limit],
    queryFn: () =>
      fetchCommentsByResource(resourceType, resourceId, limit, offset),
    enabled: !!resourceType && !!resourceId,
  });
}

/**
 * Get a specific comment
 */
export function useCommentById(id: number) {
  return useQuery({
    queryKey: ["comment", id],
    queryFn: () => fetchCommentById(id),
    enabled: !!id,
  });
}

/**
 * Create a new comment
 */
export function useCreateComment() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: createComment,
    onSuccess: (newComment) => {
      // Invalidate the list for this resource
      qc.invalidateQueries({
        queryKey: [
          "comments-resource",
          newComment.resourceType,
          newComment.resourceId,
        ],
      });
    },
    throwOnError: false,
  });
}

/**
 * Update a comment
 */
export function useUpdateComment() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCommentInput }) =>
      updateComment(id, data),
    onSuccess: (updatedComment) => {
      qc.invalidateQueries({ queryKey: ["comment", updatedComment.id] });
      // Invalidate the list for this resource
      qc.invalidateQueries({
        queryKey: [
          "comments-resource",
          updatedComment.resourceType,
          updatedComment.resourceId,
        ],
      });
    },
    throwOnError: false,
  });
}

/**
 * Delete a comment
 */
export function useDeleteComment() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: deleteComment,
    onSuccess: (_, id) => {
      qc.removeQueries({ queryKey: ["comment", id] });
      qc.invalidateQueries({ queryKey: ["comments-resource"] });
    },
    throwOnError: false,
  });
}
