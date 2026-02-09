/**
 * Central source of truth for resource types
 * Used across likes, comments, collections, views, etc.
 */

export const RESOURCE_TYPES = {
  POST: "POST",
  COMMENT: "COMMENT",
  // VIDEO: "VIDEO",
  // ARTICLE: "ARTICLE",
} as const;

export type ResourceType = (typeof RESOURCE_TYPES)[keyof typeof RESOURCE_TYPES];
