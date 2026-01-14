import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import {
  createPost,
  fetchPostById,
  fetchPosts,
  fetchPostsOffset,
  fetchPostsCursor,
  fetchPostSuggestions,
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

export function usePostsOffset(page: number, limit: number) {
  const offset = (page - 1) * limit;

  return useQuery({
    queryKey: ["posts-offset", page],
    queryFn: () => fetchPostsOffset({ limit, offset }),
  });
}

export function usePostsCursor(limit: number = 10) {
  return useInfiniteQuery({
    queryKey: ["posts-cursor"],
    queryFn: ({ pageParam }) =>
      fetchPostsCursor({
        limit,
        cursor: pageParam ?? null,
      }),

    // pageParam = nextCursor from backend
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: null as string | null,
  });
}

export function usePostSuggestions(q: string, limit: number = 5) {
  return useQuery({
    queryKey: ["post-suggestions", q],
    queryFn: () => fetchPostSuggestions(q, limit),
    enabled: !!q,
  });
}

export function useCreatePost() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: createPost,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["posts"] });
    },
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
  });
}
