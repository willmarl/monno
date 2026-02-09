import { fetcher } from "@/lib/fetcher";
import type { View, ViewInput } from "./types/view";
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
