"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useRouter } from "next/navigation";
import { Avatar, AvatarImage, AvatarFallback } from "./avatar";
import { formatDate } from "@/lib/utils/date";
import { Button } from "./button";
import { ThumbsUp } from "lucide-react";
import { useToggleLike } from "@/features/likes/hooks";
import { Comment as CommentType } from "@/features/comments/types/comment";

export function Comment({
  data,
  isOwner,
}: {
  data: CommentType;
  isOwner: boolean;
}) {
  const like = useToggleLike();

  const router = useRouter();

  const commentDate = formatDate(data.createdAt);

  let isEdited: boolean = false;

  //   check if edited
  if (data.createdAt != data.updatedAt) {
    isEdited = true;
  }

  function renderEditVisual() {
    if (!data?.updatedAt) return null;
    const editedDate = formatDate(data.updatedAt);
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="text-xs text-muted-foreground opacity-75 cursor-help">
            (edited)
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>Edited on {editedDate}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  function handleLike() {
    like.mutate({ resourceType: "COMMENT", resourceId: data.id });
  }

  function likeFeature(isOwner: boolean) {
    if (!isOwner) {
      return (
        <div className="flex gap-1 items-center">
          <Button variant="ghost">
            <ThumbsUp />
          </Button>
          {data.likeCount}
        </div>
      );
    } else {
      if (data.likedByMe) {
        return (
          <div className="flex gap-1 items-center">
            <Button
              variant="ghost"
              // className="cursor-pointer"
              onClick={handleLike}
              className="cursor-pointer transition-transform hover:scale-110"
            >
              <ThumbsUp fill="#000000" color="#000000" />
            </Button>
            {data.likeCount}
          </div>
        );
      } else {
        return (
          <div className="flex gap-1 items-center">
            <Button
              variant="ghost"
              onClick={handleLike}
              className="cursor-pointer transition-transform hover:scale-110"
            >
              <ThumbsUp onClick={handleLike} />
            </Button>
            {data.likeCount}
          </div>
        );
      }
    }
  }

  return (
    <div className="flex gap-3">
      {/* Avatar - Left Side */}
      <Avatar
        className="h-10 w-10 flex-shrink-0 cursor-pointer"
        onClick={() =>
          data?.creator.username &&
          router.push(`/user/${data.creator.username}`)
        }
      >
        <AvatarImage
          src={data?.creator.avatarPath || undefined}
          alt={data?.creator.username || "User"}
        />
        <AvatarFallback>
          {data?.creator.username?.[0]?.toUpperCase() || "?"}
        </AvatarFallback>
      </Avatar>

      {/* Content - Right Side */}
      <div className="flex-1">
        {/* Top: Username and Date */}
        <div className="flex items-center gap-2 mb-1">
          <p
            className="text-sm font-semibold cursor-pointer hover:text-foreground"
            onClick={() =>
              data?.creator.username &&
              router.push(`/user/${data.creator.username}`)
            }
          >
            {data?.creator.username || "Unknown"}
          </p>
          <p className="text-xs text-muted-foreground">{commentDate}</p>
          {isEdited && renderEditVisual()}
        </div>

        {/* Bottom: Comment Content */}
        <p className="text-sm text-foreground mb-2">{data?.content || ""}</p>

        {/* Actions */}

        <div className="flex items-center gap-2">{likeFeature(isOwner)}</div>
      </div>
    </div>
  );
}
