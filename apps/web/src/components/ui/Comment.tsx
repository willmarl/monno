"use client";

import { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useRouter } from "next/navigation";
import { Avatar, AvatarImage, AvatarFallback } from "./avatar";
import { formatDate } from "@/lib/utils/date";
import { Button } from "./button";
import { Textarea } from "./textarea";
import { EllipsisVertical, ThumbsUp, X } from "lucide-react";
import { useToggleLike } from "@/features/likes/hooks";
import { Comment as CommentType } from "@/features/comments/types/comment";
import { useModal } from "@/components/modal/ModalProvider";
import { ConfirmModal } from "../modal/ConfirmModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { useDeleteComment, useUpdateComment } from "@/features/comments/hooks";

export function Comment({
  data,
  isOwner,
}: {
  data: CommentType;
  isOwner: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(data.content);
  const like = useToggleLike();
  const { openModal, closeModal } = useModal();
  const router = useRouter();
  const commentDate = formatDate(data.createdAt);
  const deleteComment = useDeleteComment();
  const updateComment = useUpdateComment();

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

  function handleEdit() {
    updateComment.mutate(
      {
        id: data.id,
        data: { content: editContent },
      },
      {
        onSuccess: () => {
          setIsEditing(false);
        },
      },
    );
  }

  function handleDelete() {
    return openModal({
      title: "Delete comment",
      content: (
        <ConfirmModal
          message="Are you sure you want to delete comment"
          onConfirm={() => {
            deleteComment.mutate(data.id);
            closeModal();
          }}
        />
      ),
    });
  }

  function commentMenu() {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost">
            <EllipsisVertical />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="left" align="start" sideOffset={-5}>
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => setIsEditing(true)}>
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDelete} variant="destructive">
              Delete
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
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
      <div className="flex-1 relative">
        {/* comment menu options - Top Right */}
        <div className="absolute right-0 top-0">
          {isOwner ? commentMenu() : ""}
        </div>
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

        {/* Bottom: Comment Content or Edit Textarea */}
        {isEditing ? (
          <div className="space-y-2 mb-2">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder="Edit your comment..."
              className="resize-none min-h-[60px] text-sm"
              disabled={updateComment.isPending}
            />
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditContent(data.content);
                  setIsEditing(false);
                }}
                disabled={updateComment.isPending}
                className="h-8"
              >
                <X size={16} className="mr-1" />
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                onClick={handleEdit}
                disabled={
                  updateComment.isPending || editContent === data.content
                }
                className="h-8"
              >
                {updateComment.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-foreground mb-2">{data?.content || ""}</p>
        )}

        {/* Actions - Only show when not editing */}
        {!isEditing && (
          <div className="flex items-center gap-2">{likeFeature(isOwner)}</div>
        )}
      </div>
    </div>
  );
}
