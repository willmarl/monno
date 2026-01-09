import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createPost,
  fetchPostById,
  fetchPosts,
  updatePost,
  deletePost,
} from "./api";

export function usePosts() {
  return useQuery({
    queryKey: ["posts"],
    queryFn: fetchPosts,
  });
}

export function usePostById(id: number) {
  return useQuery({
    queryKey: ["post", id],
    queryFn: () => fetchPostById(id),
    enabled: !!id,
  });
}

export function useCreatePost() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: createPost,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["posts"] });
    },
    throwOnError: false, // Don't throw errors, let component handle them
  });
}

export function useUpdatePost() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: Parameters<typeof updatePost>[1];
    }) => updatePost(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ["posts"] });
      qc.invalidateQueries({ queryKey: ["post", id] });
    },
    throwOnError: false, // Don't throw errors, let component handle them
  });
}

export function useDeletePost() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: deletePost,
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ["posts"] });
      qc.removeQueries({ queryKey: ["post", id] });
    },
    throwOnError: false, // Don't throw errors, let component handle them
  });
}
