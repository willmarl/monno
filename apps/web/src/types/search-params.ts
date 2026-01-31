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
 * Admin users search params (extends base SearchParams)
 */
export interface AdminUserSearchParams extends SearchParams {
  roles?: string;
  status?: string;
}

/**
 * Admin posts search params (extends base SearchParams)
 */
export interface AdminPostSearchParams extends SearchParams {
  deleted?: string;
}

/**
 * Public posts search params (extends base SearchParams)
 */
export interface PublicPostSearchParams extends SearchParams {}
