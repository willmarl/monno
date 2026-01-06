export interface Post {
  id: number;
  title: string;
  content: string;
  creatorId: string;
  createdAt: string;
}

export interface CreatePostInput {
  title: string;
  content: string;
}

export interface UpdatePostInput {
  title?: string;
  content?: string;
}
