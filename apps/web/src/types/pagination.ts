export interface PageInfo {
  totalItems: number;
  total: number;
  limit: number;
  offset?: number;
  hasNext?: boolean;
  hasPrev?: boolean;
  hasMore?: boolean;
  nextOffset?: number | null;
  prevOffset?: number | null;
}

export interface PaginatedResponse<T> {
  items: T[];
  pageInfo: PageInfo;
}

export interface CursorPageInfo {
  nextCursor: number | null;
}

export interface CursorPaginatedResponse<T> {
  items: T[];
  nextCursor: number | null;
}
