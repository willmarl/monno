"use client";

import { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useRouter } from "next/navigation";
import { RESOURCE_TYPES } from "@/types/resource";
import { Avatar, AvatarImage, AvatarFallback } from "./avatar";
import { formatDate } from "@/lib/utils/date";
import { Button } from "./button";
import { Textarea } from "./textarea";
import { EllipsisVertical, X } from "lucide-react";
import { useToggleLike } from "@/features/likes/hooks";
import { Comment as CommentType } from "@/features/comments/types/comment";
import { useModal } from "@/components/providers/ModalProvider";
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  updateCommentSchema,
  UpdateCommentInput,
} from "@/features/comments/schemas/updateComment.schema";
import { useDeleteComment, useUpdateComment } from "@/features/comments/hooks";
import { LikeButton } from "../common/LikeButton";

export function Comment({
  data,
  isOwner,
}: {
  data: CommentType;
  isOwner: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const editForm = useForm<UpdateCommentInput>({
    resolver: zodResolver(updateCommentSchema),
    defaultValues: { content: data.content },
    mode: "onChange",
  });
  const like = useToggleLike();
  const { openModal, closeModal } = useModal();
  const router = useRouter();
  const commentDate = formatDate(data.createdAt);
  const deleteComment = useDeleteComment();
  const updateComment = useUpdateComment();

  let isEdited: boolean = false;

  //   check if content was edited
  if (data.createdAt != data.contentUpdatedAt) {
    isEdited = true;
  }

  function renderEditVisual() {
    if (!data?.contentUpdatedAt) return null;
    const editedDate = formatDate(data.contentUpdatedAt);
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

  const handleEdit = editForm.handleSubmit((values) => {
    updateComment.mutate(
      {
        id: data.id,
        data: { content: values.content },
      },
      {
        onSuccess: () => {
          setIsEditing(false);
        },
      },
    );
  });

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
          variant={"destructive"}
        />
      ),
    });
  }

  function commentMenu() {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="cursor-pointer h-8 w-8 p-0"
          >
            <EllipsisVertical size={16} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="bottom" align="end">
          <DropdownMenuGroup>
            <DropdownMenuItem
              onClick={() => setIsEditing(true)}
              className="cursor-pointer text-xs sm:text-sm"
            >
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleDelete}
              variant="destructive"
              className="cursor-pointer text-xs sm:text-sm"
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  function handleLike() {
    like.mutate({ resourceType: RESOURCE_TYPES.COMMENT, resourceId: data.id });
  }

  return (
    <div className="flex gap-2 sm:gap-3">
      {/* Left: Avatar */}
      <Avatar
        className="h-8 w-8 sm:h-10 sm:w-10 shrink-0 cursor-pointer mt-0.5"
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

      {/* Middle: Content */}
      <div className="flex-1 min-w-0">
        {/* Username and Date */}
        <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-1">
          <p
            className="text-xs sm:text-sm font-semibold cursor-pointer hover:text-foreground truncate"
            onClick={() =>
              data?.creator.username &&
              router.push(`/user/${data.creator.username}`)
            }
            title={data?.creator.username || "Unknown"}
          >
            {data?.creator.username || "Unknown"}
          </p>
          <p className="text-xs text-muted-foreground whitespace-nowrap">
            {commentDate}
          </p>
          {isEdited && renderEditVisual()}
        </div>

        {/* Comment Content or Edit Textarea */}
        {isEditing ? (
          <div className="space-y-2 mb-2">
            <Textarea
              {...editForm.register("content")}
              placeholder="Edit your comment..."
              className="resize-none min-h-[60px] text-xs sm:text-sm"
              disabled={updateComment.isPending}
            />
            {editForm.formState.errors.content && (
              <p className="text-xs text-red-500">
                {editForm.formState.errors.content.message}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  editForm.reset({ content: data.content });
                  setIsEditing(false);
                }}
                disabled={updateComment.isPending}
                className="h-8 min-w-[80px] cursor-pointer text-xs sm:text-sm"
              >
                <X size={16} className="mr-1 cursor-pointer shrink-0" />
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                onClick={handleEdit}
                disabled={
                  updateComment.isPending ||
                  !editForm.formState.isDirty ||
                  !editForm.formState.isValid
                }
                className="h-8 min-w-[80px] cursor-pointer text-xs sm:text-sm"
              >
                {updateComment.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-xs sm:text-sm text-foreground mb-2 break-words">
            {data?.content || ""}
          </p>
        )}

        {/* Like - Only show when not editing */}
        {!isEditing && (
          <div className="flex items-center gap-2">
            <LikeButton
              isOwner={isOwner}
              likedByMe={data.likedByMe}
              likeCount={data.likeCount}
              onLike={handleLike}
            />
          </div>
        )}
      </div>

      {/* Right: Menu */}
      {isOwner && !isEditing && (
        <div className="shrink-0 mt-0.5">{commentMenu()}</div>
      )}
    </div>
  );
}
