import { PaginatedResponse } from "@/types/pagination";

export interface CollectionCreator {
  id: number;
  username: string;
  avatarPath: string | null;
}

export interface Collection {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  creator: CollectionCreator;
  items?: CollectionItem[];
}

export type CollectionsList = PaginatedResponse<Collection>;

export interface CollectionInput {
  name?: string;
  description?: string;
}

export interface CollectionItem {
  id: number;
  resourceType: string;
  resourceId: number;
  addedAt: string;
}

export interface PageInfo {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface CollectionWithPaginatedItems extends Omit<
  Collection,
  "items"
> {
  items: CollectionItem[];
  itemsPageInfo: PageInfo;
}

export interface CollectionItemInput {
  resourceType: string;
  resourceId: number;
}
