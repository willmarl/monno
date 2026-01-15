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
  fetchPostsSearch,
  fetchPostsCursor,
  fetchPostsSearchCursor,
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

export function usePostsSearch(
  query: string,
  page: number,
  limit: number,
  options?: { searchFields?: string; sort?: string; caseSensitive?: boolean }
) {
  const offset = (page - 1) * limit;

  return useQuery({
    queryKey: [
      "posts-search",
      query,
      page,
      options?.searchFields,
      options?.sort,
      options?.caseSensitive,
    ],
    queryFn: () =>
      fetchPostsSearch({
        query,
        limit,
        offset,
        searchFields: options?.searchFields,
        sort: options?.sort,
        caseSensitive: options?.caseSensitive,
      }),
    enabled: !!query,
  });
}

export function usePostsSearchCursor(
  query: string,
  limit: number = 10,
  options?: { searchFields?: string; sort?: string; caseSensitive?: boolean }
) {
  return useInfiniteQuery({
    queryKey: [
      "posts-search-cursor",
      query,
      options?.searchFields,
      options?.sort,
      options?.caseSensitive,
    ],
    queryFn: ({ pageParam }) =>
      fetchPostsSearchCursor({
        query,
        limit,
        cursor: pageParam ?? null,
        searchFields: options?.searchFields,
        sort: options?.sort,
        caseSensitive: options?.caseSensitive,
      }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: null as string | null,
    enabled: !!query,
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
