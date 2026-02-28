export enum ResourceTypeEnum {
  POST = 'POST',
  COMMENT = 'COMMENT',
}

// export type ResourceType = 'POST' | 'VIDEO' | 'ARTICLE' | 'COMMENT';
export type ResourceType = 'POST' | 'COMMENT';

// Module-specific subsets
export const LIKEABLE_RESOURCES = ['POST', 'COMMENT'] as const;
export const VIEWABLE_RESOURCES = ['POST'] as const;
export const COLLECTABLE_RESOURCES = ['POST', 'COMMENT'] as const;

export type LikeableResourceType = (typeof LIKEABLE_RESOURCES)[number];
export type ViewableResourceType = (typeof VIEWABLE_RESOURCES)[number];
export type CollectableResourceType = (typeof COLLECTABLE_RESOURCES)[number];
