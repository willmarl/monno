import { fetcher } from "@/lib/fetcher";
import type {
  View,
  ViewInput,
  ViewHistoryList,
  ViewableResourceType,
} from "./types/view";
import type { ResourceType } from "@/types/resource";

// POST /views
export const recordView = (data: ViewInput) =>
  fetcher<View>("/views", {
    method: "POST",
    json: data,
  });

// GET /views/FOO/2
export const fetchViewStats = (
  resourceType: ResourceType,
  resourceId: number,
) => fetcher<View>(`/views/${resourceType}/${resourceId}`);

export const fetchViewHistory = ({
  resourceType,
  limit = 9,
  offset = 0,
  query,
}: {
  resourceType: ViewableResourceType;
  limit?: number;
  offset?: number;
  query?: string;
}) => {
  const params = new URLSearchParams({
    resourceType,
    limit: String(limit),
    offset: String(offset),
  });
  if (query?.trim()) params.set("query", query.trim());
  return fetcher<ViewHistoryList>(`/views/history?${params.toString()}`);
};

export const removeViewHistoryEntry = (historyId: number) =>
  fetcher<{ deleted: boolean }>(`/views/history/${historyId}`, {
    method: "DELETE",
  });

export const clearViewHistory = (resourceType?: ViewableResourceType) =>
  fetcher<{ cleared: number }>("/views/history/clear", {
    method: "POST",
    json: resourceType ? { resourceType } : {},
  });
