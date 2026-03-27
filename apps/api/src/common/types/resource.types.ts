export enum ResourceTypeEnum {
  POST = 'POST',
  COMMENT = 'COMMENT',
  ARTICLE = 'ARTICLE',
}

// export type ResourceType = 'POST' | 'VIDEO' | 'ARTICLE' | 'COMMENT';
export type ResourceType = 'POST' | 'COMMENT' | 'ARTICLE';

// Module-specific subsets
export const LIKEABLE_RESOURCES = ['POST', 'COMMENT', 'ARTICLE'] as const;
export const VIEWABLE_RESOURCES = ['POST', 'ARTICLE'] as const;
export const COLLECTABLE_RESOURCES = ['POST', 'ARTICLE'] as const;
export const COMMENTABLE_RESOURCES = ['POST', 'COMMENT', 'ARTICLE'] as const;

export type LikeableResourceType = (typeof LIKEABLE_RESOURCES)[number];
export type ViewableResourceType = (typeof VIEWABLE_RESOURCES)[number];
export type CollectableResourceType = (typeof COLLECTABLE_RESOURCES)[number];
export type CommentableResourceType = (typeof COMMENTABLE_RESOURCES)[number];
