export enum ResourceTypeEnum {
  POST = 'POST',
  VIDEO = 'VIDEO',
  ARTICLE = 'ARTICLE',
}

export type ResourceType = 'POST' | 'VIDEO' | 'ARTICLE';

// Module-specific subsets
export const LIKEABLE_RESOURCES = ['POST'] as const;
export const VIEWABLE_RESOURCES = ['POST', 'VIDEO', 'ARTICLE'] as const;
export const COLLECTABLE_RESOURCES = ['POST', 'VIDEO', 'ARTICLE'] as const;

export type LikeableResourceType = (typeof LIKEABLE_RESOURCES)[number];
export type ViewableResourceType = (typeof VIEWABLE_RESOURCES)[number];
export type CollectableResourceType = (typeof COLLECTABLE_RESOURCES)[number];
