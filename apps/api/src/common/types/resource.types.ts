import { ResourceType } from '../../generated/prisma/client';

export type { ResourceType };

// Module-specific subsets
export const LIKEABLE_RESOURCES = ['POST', 'COMMENT'] as const;
export const VIEWABLE_RESOURCES = ['POST'] as const;
export const COLLECTABLE_RESOURCES = ['POST'] as const;
export const COMMENTABLE_RESOURCES = ['POST', 'COMMENT'] as const;

export type LikeableResourceType = (typeof LIKEABLE_RESOURCES)[number];
export type ViewableResourceType = (typeof VIEWABLE_RESOURCES)[number];
export type CollectableResourceType = (typeof COLLECTABLE_RESOURCES)[number];
export type CommentableResourceType = (typeof COMMENTABLE_RESOURCES)[number];
