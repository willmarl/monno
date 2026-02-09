import type { ResourceType } from "@/types/resource";

export interface View {
  recorded: boolean;
  viewCount: number;
}

export interface ViewInput {
  resourceType: ResourceType;
  resourceId: number;
}
