/**
 * Central source of truth for resource types
 * Used across likes, reactions, comments, collections, views, etc.
 */

export const RESOURCE_TYPES = {
  POST: "POST",
  COMMENT: "COMMENT",
  ARTICLE: "ARTICLE",
  COLLECTION: "COLLECTION",
  USER: "USER",
  // VIDEO: "VIDEO",
} as const;

export type ResourceType = (typeof RESOURCE_TYPES)[keyof typeof RESOURCE_TYPES];
