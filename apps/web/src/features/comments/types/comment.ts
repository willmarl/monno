import { PaginatedResponse } from "@/types/pagination";

export interface CommentCreator {
  id: number;
  username: string;
  avatarPath: string | null;
}

export interface Comment {
  id: number;
  content: string;
  resourceType: string;
  resourceId: number;
  likeCount: number;
  likedByMe: boolean;
  createdAt: string;
  updatedAt: string;
  creator: CommentCreator;
}

export type CommentsList = PaginatedResponse<Comment>;

export interface CommentInput {
  resourceType: string;
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
