import type { ResourceType } from "@/types/resource";
import type { Post } from "@/features/posts/types/post";
import type { Article } from "@/features/articles/types/article";

export interface View {
  recorded: boolean;
  viewCount: number;
}

export interface ViewInput {
  resourceType: ResourceType;
  resourceId: number;
}

export type ViewHistoryPostItem = Post & {
  historyId: number;
  viewedAt: string;
};

export type ViewHistoryArticleItem = Article & {
  historyId: number;
  viewedAt: string;
};

export type ViewHistoryItem = ViewHistoryPostItem | ViewHistoryArticleItem;

export interface ViewHistoryList {
  items: ViewHistoryItem[];
  pageInfo: {
    totalItems: number;
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export type ViewableResourceType = "POST" | "ARTICLE";
