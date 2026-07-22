import { usePostById } from "@/features/posts/hooks";
import { useArticleById } from "@/features/articles/hooks";
import { Post } from "./Post";
import { CollectionItem as CollectionItemType } from "@/features/collections/types/collection";
import { Article } from "./Article";

interface CollectionItemProps {
  item: CollectionItemType;
  isOwner: boolean;
}

/** Unavailable / private-to-others items are omitted (YouTube playlist style). */
export function CollectionItem({ item, isOwner }: CollectionItemProps) {
  if (item.resourceType === "POST") {
    return <CollectionPostItem resourceId={item.resourceId} isOwner={isOwner} />;
  }

  if (item.resourceType === "ARTICLE") {
    return (
      <CollectionArticleItem resourceId={item.resourceId} isOwner={isOwner} />
    );
  }

  return <div>Unknown resource type: {item.resourceType}</div>;
}

function CollectionPostItem({
  resourceId,
  isOwner,
}: {
  resourceId: number;
  isOwner: boolean;
}) {
  const { data: post, isLoading, isError } = usePostById(resourceId);

  if (isLoading) return <div>Loading post...</div>;
  if (isError || !post) return null;

  return <Post data={post} isOwner={isOwner} />;
}

function CollectionArticleItem({
  resourceId,
  isOwner,
}: {
  resourceId: number;
  isOwner: boolean;
}) {
  const { data: article, isLoading, isError } = useArticleById(resourceId);

  if (isLoading) return <div>Loading article...</div>;
  if (isError || !article) return null;

  return <Article data={article} isOwner={isOwner} />;
}
