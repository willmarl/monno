import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ResourceType } from "@/types/resource";
import type { ViewableResourceType } from "./types/view";
import {
  recordView,
  fetchViewStats,
  fetchViewHistory,
  removeViewHistoryEntry,
  clearViewHistory,
} from "./api";

export function useRecordView() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: recordView,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["view"], exact: false });
      qc.invalidateQueries({ queryKey: ["view-history"], exact: false });
    },
    throwOnError: false,
  });
}

export function useViewStats(resourceType: ResourceType, resourceId: number) {
  return useQuery({
    queryKey: ["view", resourceId],
    queryFn: () => fetchViewStats(resourceType, resourceId),
    enabled: !!resourceId,
  });
}

export function useViewHistory(
  resourceType: ViewableResourceType,
  page: number = 1,
  limit: number = 9,
  query: string = "",
) {
  const offset = (page - 1) * limit;

  return useQuery({
    queryKey: ["view-history", resourceType, page, limit, query],
    queryFn: () =>
      fetchViewHistory({
        resourceType,
        limit,
        offset,
        query: query || undefined,
      }),
  });
}

export function useRemoveViewHistoryEntry() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: removeViewHistoryEntry,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["view-history"], exact: false });
    },
  });
}

export function useClearViewHistory() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (resourceType?: ViewableResourceType) =>
      clearViewHistory(resourceType),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["view-history"], exact: false });
    },
  });
}
