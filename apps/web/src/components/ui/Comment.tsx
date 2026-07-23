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
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  editCommentSchema,
  EditCommentInput,
} from "@/features/comments/schemas/editComment.schema";
import {
  useCommentsByResource,
  useDeleteComment,
  useUpdateComment,
} from "@/features/comments/hooks";
import { LikeButton } from "../common/LikeButton";
import { ReportButton } from "../common/ReportButton";
import { AdminRemoveButton } from "../common/AdminRemoveButton";
import { NewCommentForm } from "@/features/comments/components/NewCommentForm";
import { useSessionUser } from "@/features/auth/hooks";
import { useQueryClient } from "@tanstack/react-query";

/**
 * YouTube-style cap: depth 0 = top-level, 1 = reply, 2 = reply-to-reply (3 layers).
 * Deeper "Reply" targets the parent so new posts stay siblings at max depth.
 */
const MAX_NEST_DEPTH = 2;
const REPLIES_LIMIT = 50;

function replyTarget(
  comment: CommentType,
  depth: number,
): { resourceType: typeof RESOURCE_TYPES.COMMENT; resourceId: number } {
  if (depth < MAX_NEST_DEPTH) {
    return { resourceType: RESOURCE_TYPES.COMMENT, resourceId: comment.id };
  }
  // At max depth: attach under this comment's parent (sibling of current).
  if (comment.resourceType === RESOURCE_TYPES.COMMENT) {
    return {
      resourceType: RESOURCE_TYPES.COMMENT,
      resourceId: comment.resourceId,
    };
  }
  return { resourceType: RESOURCE_TYPES.COMMENT, resourceId: comment.id };
}

export function Comment({
  data,
  isOwner,
  depth = 0,
}: {
  data: CommentType;
  isOwner: boolean;
  depth?: number;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const editForm = useForm<EditCommentInput>({
    resolver: zodResolver(editCommentSchema),
    defaultValues: { content: data.content },
    mode: "onChange",
  });
  const like = useToggleLike();
  const { openModal, closeModal } = useModal();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: currentUser } = useSessionUser();
  const commentDate = formatDate(data.createdAt);
  const deleteComment = useDeleteComment();
  const updateComment = useUpdateComment();

  const atMaxDepth = depth >= MAX_NEST_DEPTH;
  const canNestReplies = depth < MAX_NEST_DEPTH;
  const target = replyTarget(data, depth);

  const repliesEnabled = canNestReplies && (showReplies || isReplying);
  const { data: repliesData, isLoading: repliesLoading } =
    useCommentsByResource(
      RESOURCE_TYPES.COMMENT,
      data.id,
      1,
      REPLIES_LIMIT,
      { enabled: repliesEnabled },
    );

  const replies = repliesData?.items ?? [];
  const replyCount =
    repliesData?.pageInfo?.total ??
    repliesData?.pageInfo?.totalItems ??
    replies.length;

  let isEdited = false;
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
    like.mutateAsync({
      resourceType: RESOURCE_TYPES.COMMENT,
      resourceId: data.id,
    });
  }

  /** Indent content only — menu stays on the far right of the full row. */
  const contentIndent =
    depth === 0 ? "" : depth === 1 ? "pl-3 sm:pl-4" : "pl-6 sm:pl-8";
  const threadLine =
    depth > 0 ? "border-l border-border/60" : "";

  return (
    <div className="w-full min-w-0">
      <div className="flex gap-2 sm:gap-3 min-w-0 w-full items-start">
        <div
          className={`flex flex-1 min-w-0 gap-2 sm:gap-3 ${contentIndent}`}
        >
          <div className={`flex flex-1 min-w-0 gap-2 sm:gap-3 ${threadLine} ${depth > 0 ? "pl-3 sm:pl-4" : ""}`}>
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

            <div className="flex-1 min-w-0 overflow-hidden">
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
                <p className="text-xs sm:text-sm text-foreground mb-2 break-words whitespace-pre-wrap">
                  {data?.content || ""}
                </p>
              )}

              {!isEditing && (
                <div className="flex flex-wrap items-center gap-2">
                  <LikeButton
                    isOwner={isOwner}
                    likedByMe={data.likedByMe}
                    likeCount={data.likeCount}
                    onLike={handleLike}
                  />
                  {currentUser && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-xs cursor-pointer"
                      onClick={() => {
                        setIsReplying((v) => !v);
                        if (canNestReplies) setShowReplies(true);
                      }}
                    >
                      Reply
                    </Button>
                  )}
                  {canNestReplies && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-xs cursor-pointer text-muted-foreground"
                      onClick={() => setShowReplies((v) => !v)}
                    >
                      {showReplies
                        ? replyCount > 0
                          ? `Hide replies (${replyCount})`
                          : "Hide replies"
                        : "Show replies"}
                    </Button>
                  )}
                  <ReportButton
                    resourceType={RESOURCE_TYPES.COMMENT}
                    resourceId={data.id}
                    isOwner={isOwner}
                  />
                  <AdminRemoveButton
                    resourceType={RESOURCE_TYPES.COMMENT}
                    resourceId={data.id}
                  />
                </div>
              )}

              {isReplying && currentUser && (
                <NewCommentForm
                  resourceType={target.resourceType}
                  resourceId={target.resourceId}
                  user={currentUser}
                  compact
                  placeholder="Add a reply..."
                  submitLabel="Reply"
                  onCancel={() => setIsReplying(false)}
                  onSuccess={() => {
                    setIsReplying(false);
                    if (canNestReplies) {
                      setShowReplies(true);
                    } else {
                      queryClient.invalidateQueries({
                        queryKey: [
                          "comments-resource",
                          target.resourceType,
                          target.resourceId,
                        ],
                      });
                    }
                  }}
                />
              )}
            </div>
          </div>
        </div>

        {isOwner && !isEditing && (
          <div className="shrink-0 mt-0.5">{commentMenu()}</div>
        )}
      </div>

      {canNestReplies && showReplies && (
        <div className="mt-3 space-y-3 w-full">
          {repliesLoading && replies.length === 0 ? (
            <p className="text-xs text-muted-foreground pl-1">
              Loading replies…
            </p>
          ) : replies.length === 0 ? (
            <p className="text-xs text-muted-foreground pl-1">
              No replies yet.
            </p>
          ) : (
            replies.map((reply) => (
              <Comment
                key={reply.id}
                data={reply}
                isOwner={currentUser?.id === reply.creator.id}
                depth={Math.min(depth + 1, MAX_NEST_DEPTH)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
