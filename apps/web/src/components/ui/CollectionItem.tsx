import { usePostById } from "@/features/posts/hooks";
import { useArticleById } from "@/features/articles/hooks";
import { Post } from "./Post";
import { CollectionItem as CollectionItemType } from "@/features/collections/types/collection";
import { Article } from "./Article";

interface CollectionItemProps {
  item: CollectionItemType;
  isOwner: boolean;
}

export function CollectionItem({ item, isOwner }: CollectionItemProps) {
  if (item.resourceType === "POST") {
    const { data: post } = usePostById(item.resourceId);
    if (!post) return <div>Loading post...</div>;
    return <Post data={post} isOwner={isOwner} />;
  }

  if (item.resourceType === "ARTICLE") {
    const { data: article } = useArticleById(item.resourceId);
    if (!article) return <div>Loading article...</div>;
    return <Article data={article} isOwner={isOwner} />;
  }

  // if (item.resourceType === "VIDEO") {
  //   return <div>Video #{item.resourceId}</div>;
  // }

  return <div>Unknown resource type: {item.resourceType}</div>;
}
