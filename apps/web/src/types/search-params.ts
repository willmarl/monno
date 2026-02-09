/**
 * Common search/filter parameters shared across paginated admin pages
 * Extend this interface for specific pages that need additional filters
 */
export interface SearchParams {
  q?: string;
  searchFields?: string;
  sort?: string;
  page?: string;
  limit?: string;
  caseSensitive?: string;
  [key: string]: string | undefined;
}

/**
 * Admin search params (extends base SearchParams)
 */
export interface AdminUserSearchParams extends SearchParams {
  roles?: string;
  status?: string;
}
export interface AdminPostSearchParams extends SearchParams {
  deleted?: string;
}

export interface AdminCommentSearchParams extends SearchParams {
  deleted?: string;
}

/**
 * Public search params (extends base SearchParams)
 */
export interface PublicPostSearchParams extends SearchParams {}

export interface PublicUserSearchParams extends SearchParams {}
