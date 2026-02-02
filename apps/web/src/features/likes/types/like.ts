export interface Like {
  Liked: boolean;
  likeCounter: number;
}

export interface LikeInput {
  resourceType: string;
  resourceId: number;
}
