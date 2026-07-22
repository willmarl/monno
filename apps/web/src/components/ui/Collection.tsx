"use client";

import { Card } from "./card";
import { FolderPlus } from "lucide-react";
import { Collection } from "@/features/collections/types/collection";
import { useRouter } from "next/navigation";
import { LikeButton } from "../common/LikeButton";
import { useToggleLike } from "@/features/likes/hooks";
import { RESOURCE_TYPES } from "@/types/resource";

export function CollectionCard({
  data,
  isOwner,
}: {
  data: Collection;
  isOwner: boolean;
}) {
  const router = useRouter();
  const like = useToggleLike();

  function handleLike(e: React.MouseEvent) {
    e.stopPropagation();
    like.mutateAsync({
      resourceType: RESOURCE_TYPES.COLLECTION,
      resourceId: data.id,
    });
  }

  return (
    <Card
      onClick={() => router.push(`/collection/${data.id}`)}
      className="p-6 cursor-pointer"
    >
      <div className="flex items-center gap-3 mb-3">
        <FolderPlus className="w-6 h-6 flex-shrink-0 text-muted-foreground" />
        <h3 className="font-semibold text-base truncate flex-1">{data?.name}</h3>
        {data.visibility === "PRIVATE" && (
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground border border-border px-1.5 py-0.5 rounded flex-shrink-0">
            Private
          </span>
        )}
      </div>
      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
        {data?.description}
      </p>
      <div
        className="flex justify-end"
        onClick={(e) => e.stopPropagation()}
      >
        <LikeButton
          isOwner={isOwner}
          likedByMe={data.likedByMe}
          likeCount={data.likeCount}
          onLike={handleLike}
        />
      </div>
    </Card>
  );
}
