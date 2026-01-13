import { PaginatedResponse } from "@/types/pagination";

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
}

export type PostsList = PaginatedResponse<Post>;

export interface PostListCursor {
  items: Post[];
  nextCursor: string;
}

export interface CreatePostInput {
  title: string;
  content: string;
}

export interface UpdatePostInput {
  title?: string;
  content?: string;
}
