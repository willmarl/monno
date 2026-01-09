interface Creator {
  id: number;
  username: string;
}
export interface Post {
  id: number;
  title: string;
  content: string;
  creator: Creator;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePostInput {
  title: string;
  content: string;
}

export interface UpdatePostInput {
  title?: string;
  content?: string;
}
