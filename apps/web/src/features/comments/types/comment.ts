import { PaginatedResponse } from "@/types/pagination";
import type { ResourceType } from "@/types/resource";

export interface CommentCreator {
  id: number;
  username: string;
  avatarPath: string | null;
}

export interface Comment {
  id: number;
  content: string;
  resourceType: ResourceType;
  resourceId: number;
  likeCount: number;
  likedByMe: boolean;
  createdAt: string;
  updatedAt: string;
  contentUpdatedAt: string;
  creator: CommentCreator;
  deleted?: boolean;
  deletedAt?: string | null;
}

export type CommentsList = PaginatedResponse<Comment>;

export interface CommentInput {
  resourceType: ResourceType;
  resourceId: number;
  content: string;
}

export interface UpdateCommentInput {
  content: string;
}

export interface PageInfo {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}
