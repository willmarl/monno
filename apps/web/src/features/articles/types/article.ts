import { PaginatedResponse } from "@/types/pagination";

export const ARTICLE_STATUSES = [
  "DRAFT",
  "PUBLISHED",
  "ARCHIVED",
  "SCHEDULED",
] as const;
export type ArticleStatus = (typeof ARTICLE_STATUSES)[number];

interface Creator {
  id: number;
  username: string;
  avatarPath: string;
}

export interface ArticleMedia {
  id: number;
  original: string;
  thumbnail: string | null;
  mimeType: string;
  sizeBytes: number | null;
  sortOrder: number;
  isPrimary: boolean;
  createdAt: string;
}

export interface Article {
  id: number;
  title: string;
  content: string;
  media: ArticleMedia[];
  creator: Creator;
  createdAt: string;
  updatedAt: string;
  status: ArticleStatus;
  likeCount: number;
  likedByMe: boolean;
  viewCount: number;
}

export type ArticlesList = PaginatedResponse<Article>;

export interface ArticleListCursor {
  items: Article[];
  nextCursor: string;
}

export interface CreateArticleInput {
  title: string;
  content: string;
  status: ArticleStatus;
}

export interface UpdateArticleInput {
  title?: string;
  content?: string;
  status?: ArticleStatus;
}
