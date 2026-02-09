import type { ResourceType } from "@/types/resource";

export interface Like {
  Liked: boolean;
  likeCounter: number;
}

export interface LikeInput {
  resourceType: ResourceType;
  resourceId: number;
}
