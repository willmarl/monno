import { ResourceType } from '../../generated/prisma/client';

export type { ResourceType };

// Module-specific subsets
export const LIKEABLE_RESOURCES = ['POST', 'COMMENT', 'ARTICLE', 'COLLECTION'] as const;
/** Discord-style emoji reactions (alongside likes). Same surface as likeable for now. */
export const REACTABLE_RESOURCES = ['POST', 'COMMENT', 'ARTICLE', 'COLLECTION'] as const;
export const VIEWABLE_RESOURCES = ['POST', 'ARTICLE'] as const;
export const COLLECTABLE_RESOURCES = ['POST', 'ARTICLE'] as const;
export const COMMENTABLE_RESOURCES = ['POST', 'COMMENT', 'ARTICLE'] as const;
export const REPORTABLE_RESOURCES = [
  'POST',
  'ARTICLE',
  'COMMENT',
  'COLLECTION',
  'USER',
] as const;
/** Owners get in-app/email engagement notifications (like/comment). Opt-in per resource. */
export const NOTIFIABLE_RESOURCES = [
  'POST',
  'ARTICLE',
  'COLLECTION',
  'COMMENT',
] as const;

export type LikeableResourceType = (typeof LIKEABLE_RESOURCES)[number];
export type ReactableResourceType = (typeof REACTABLE_RESOURCES)[number];
export type ViewableResourceType = (typeof VIEWABLE_RESOURCES)[number];
export type CollectableResourceType = (typeof COLLECTABLE_RESOURCES)[number];
export type CommentableResourceType = (typeof COMMENTABLE_RESOURCES)[number];
export type ReportableResourceType = (typeof REPORTABLE_RESOURCES)[number];
export type NotifiableResourceType = (typeof NOTIFIABLE_RESOURCES)[number];

export function isNotifiableResourceType(
  type: string,
): type is NotifiableResourceType {
  return (NOTIFIABLE_RESOURCES as readonly string[]).includes(type);
}
