export interface PageInfo {
  totalItems: number;
  limit: number;
  offset: number;
  hasNext: boolean;
  hasPrev: boolean;
  nextOffset: number;
  prevOffset: number;
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
