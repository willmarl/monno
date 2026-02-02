import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toggleLike } from "./api";

export function useToggleLike() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: toggleLike,
    onSuccess: () => {
      // Invalidate all posts and post-related queries to refetch like status
      qc.invalidateQueries({ queryKey: ["posts"], exact: false });
      qc.invalidateQueries({ queryKey: ["post"], exact: false });
      qc.invalidateQueries({ queryKey: ["liked-by-user"], exact: false });
      qc.invalidateQueries({ queryKey: ["posts-by-user"], exact: false });
    },
    throwOnError: false, // Don't throw errors, let component handle them
  });
}
