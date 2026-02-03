import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { recordView, fetchViewStats } from "./api";

export function useRecordView() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: recordView,
    onSuccess: (data) => {
      // Invalidate view stats for this resource to get latest count
      qc.invalidateQueries({ queryKey: ["view"], exact: false });
    },
    throwOnError: false, // Don't throw errors, let component handle them
  });
}

export function useViewStats(resourceType: string, resourceId: number) {
  return useQuery({
    queryKey: ["view", resourceId],
    queryFn: () => fetchViewStats(resourceType, resourceId),
    enabled: !!resourceId,
  });
}
