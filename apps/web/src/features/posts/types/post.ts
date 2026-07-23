import { PaginatedResponse } from "@/types/pagination";
import type { ReactionSummary } from "@/features/reactions/types";

interface Creator {
  id: number;
  username: string;
  avatarPath: string;
}

export interface Post {
  id: number;
  title: string;
  content: string;
  creator: Creator;
  createdAt: string;
  updatedAt: string;
  deleted: boolean;
  deletedAt: string;
  likeCount: number;
  likedByMe: boolean;
  reactions?: ReactionSummary[];
  viewCount: number;
  visibility: "PUBLIC" | "PRIVATE";
}

export type PostsList = PaginatedResponse<Post>;

export interface PostListCursor {
  items: Post[];
  nextCursor: string;
}

export interface CreatePostInput {
  title: string;
  content: string;
  visibility?: "PUBLIC" | "PRIVATE";
}

export interface UpdatePostInput {
  title?: string;
  content?: string;
  visibility?: "PUBLIC" | "PRIVATE";
}
