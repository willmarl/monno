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
  fetchPostsCursor,
  fetchPostSuggestions,
  fetchPostsByUserId,
  fetchPostsByUserIdCursor,
  updatePost,
  deletePost,
} from "./api";

export function usePostById(id: number) {
  return useQuery({
    queryKey: ["post", id],
    queryFn: () => fetchPostById(id),
    enabled: !!id,
  });
}

export function usePosts(
  page: number = 1,
  limit: number = 10,
  query?: string,
  options?: { searchFields?: string; sort?: string; caseSensitive?: boolean },
) {
  const offset = (page - 1) * limit;

  return useQuery({
    queryKey: [
      "posts",
      page,
      query,
      options?.searchFields,
      options?.sort,
      options?.caseSensitive,
    ],
    queryFn: () =>
      fetchPosts({
        query,
        limit,
        offset,
        searchFields: options?.searchFields,
        sort: options?.sort,
        caseSensitive: options?.caseSensitive,
      }),
  });
}

export function usePostsCursor(
  limit: number = 10,
  query?: string,
  options?: { searchFields?: string; sort?: string; caseSensitive?: boolean },
) {
  return useInfiniteQuery({
    queryKey: [
      "posts-cursor",
      query,
      options?.searchFields,
      options?.sort,
      options?.caseSensitive,
    ],
    queryFn: ({ pageParam }) =>
      fetchPostsCursor({
        query,
        limit,
        cursor: pageParam ?? null,
        searchFields: options?.searchFields,
        sort: options?.sort,
        caseSensitive: options?.caseSensitive,
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

export function usePostsByUserId(userId: number, page: number, limit: number) {
  const offset = (page - 1) * limit;

  return useQuery({
    queryKey: ["posts-by-user", userId, page],
    queryFn: () => fetchPostsByUserId({ userId, limit, offset }),
    enabled: !!userId,
  });
}

export function usePostsByUserIdCursor(userId: number, limit: number = 10) {
  return useInfiniteQuery({
    queryKey: ["posts-by-user-cursor", userId],
    queryFn: ({ pageParam }) =>
      fetchPostsByUserIdCursor({
        userId,
        limit,
        cursor: pageParam ?? null,
      }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: null as string | null,
    enabled: !!userId,
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
