import { usePostById } from "@/features/posts/hooks";
import { Post } from "./Post";
import { CollectionItem as CollectionItemType } from "@/features/collections/types/collection";

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

  if (item.resourceType === "VIDEO") {
    return <div>Video #{item.resourceId} (coming soon)</div>;
  }

  if (item.resourceType === "ARTICLE") {
    return <div>Article #{item.resourceId} (coming soon)</div>;
  }

  return <div>Unknown resource type: {item.resourceType}</div>;
}
