export enum ResourceTypeEnum {
  POST = 'POST',
  VIDEO = 'VIDEO',
  ARTICLE = 'ARTICLE',
  COMMENT = 'COMMENT',
}

export type ResourceType = 'POST' | 'VIDEO' | 'ARTICLE' | 'COMMENT';

// Module-specific subsets
export const LIKEABLE_RESOURCES = ['POST', 'COMMENT'] as const;
export const VIEWABLE_RESOURCES = ['POST', 'VIDEO', 'ARTICLE'] as const;
export const COLLECTABLE_RESOURCES = [
  'POST',
  'VIDEO',
  'ARTICLE',
  // 'COMMENT',
] as const;

export type LikeableResourceType = (typeof LIKEABLE_RESOURCES)[number];
export type ViewableResourceType = (typeof VIEWABLE_RESOURCES)[number];
export type CollectableResourceType = (typeof COLLECTABLE_RESOURCES)[number];
