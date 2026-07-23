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
import { ChevronDown, ChevronUp, EllipsisVertical, X } from "lucide-react";
import { useToggleLike } from "@/features/likes/hooks";
import {
  Comment as CommentType,
  CommentCreator,
} from "@/features/comments/types/comment";
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
import { ReactionsBar } from "../common/ReactionsBar";
import { NewCommentForm } from "@/features/comments/components/NewCommentForm";
import { useSessionUser } from "@/features/auth/hooks";
import { useQueryClient } from "@tanstack/react-query";

/**
 * YouTube-style cap: depth 0 = top-level, 1 = reply, 2 = reply-to-reply (3 layers).
 * Deeper "Reply" targets the parent so new posts stay siblings at max depth.
 */
const MAX_NEST_DEPTH = 2;
const REPLIES_LIMIT = 50;
/** Matches Avatar w-8 / sm:w-10 so the spine sits under the PFP center. */
const AVATAR_COL = "w-8 sm:w-10";

/**
 * YouTube branch segment for one sibling under a parent.
 * - Last sibling: "L" only (vertical ends at the curve — no line below).
 * - Not last: "T" (continuous vertical + branch; spine runs through the junction).
 */
function ThreadBranch({ isLast }: { isLast: boolean }) {
  return (
    <div
      className={`${AVATAR_COL} shrink-0 relative ${
        isLast ? "h-4 sm:h-5 self-start" : "self-stretch"
      }`}
      aria-hidden
    >
      {/* T only: unbroken vertical through this row and down to the next sibling */}
      {!isLast && (
        <div className="absolute left-1/2 top-0 bottom-0 z-[1] w-px -translate-x-1/2 bg-border" />
      )}
      {/*
        Elbow toward child PFP. Shifted 0.5px left so border-l shares the
        spine's pixel (1px was too far; 0 left a double-thick seam).
      */}
      <div className="absolute top-0 left-[calc(50%-0.5px)] h-4 sm:h-5 w-[calc(50%+2px)] border-l border-b border-border rounded-bl-[10px]" />
    </div>
  );
}

/** YouTube collapsed/expanded replies control (creator avatar when they replied). */
function RepliesToggle({
  count,
  expanded,
  creatorReply,
  onClick,
}: {
  count: number;
  expanded: boolean;
  creatorReply?: CommentCreator | null;
  onClick: () => void;
}) {
  const label = expanded
    ? "Hide replies"
    : `${count} ${count === 1 ? "reply" : "replies"}`;

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 sm:gap-2 min-h-8 text-sm font-medium text-foreground hover:text-foreground/80 cursor-pointer"
    >
      {creatorReply && !expanded && (
        <Avatar className="h-6 w-6 shrink-0">
          <AvatarImage
            src={creatorReply.avatarPath || undefined}
            alt={creatorReply.username}
          />
          <AvatarFallback className="text-[10px]">
            {creatorReply.username?.[0]?.toUpperCase() || "?"}
          </AvatarFallback>
        </Avatar>
      )}
      {creatorReply && !expanded && (
        <span className="text-muted-foreground font-normal" aria-hidden>
          ·
        </span>
      )}
      <span>{label}</span>
      {expanded ? (
        <ChevronUp className="h-4 w-4 shrink-0" />
      ) : (
        <ChevronDown className="h-4 w-4 shrink-0" />
      )}
    </button>
  );
}

function replyTarget(
  comment: CommentType,
  depth: number,
): { resourceType: typeof RESOURCE_TYPES.COMMENT; resourceId: number } {
  if (depth < MAX_NEST_DEPTH) {
    return { resourceType: RESOURCE_TYPES.COMMENT, resourceId: comment.id };
  }
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
  const fetchedReplyCount =
    repliesData?.pageInfo?.total ??
    repliesData?.pageInfo?.totalItems ??
    replies.length;
  const storedReplyCount = data.replyCount ?? 0;
  const displayReplyCount = Math.max(
    storedReplyCount,
    fetchedReplyCount,
    replies.length,
  );
  const creatorReply = data.creatorReply ?? null;
  const hasReplies = displayReplyCount > 0;

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

  /** Spine under PFP when the replies toggle or expanded thread is showing. */
  const showBodySpine =
    canNestReplies && (showReplies || (!showReplies && hasReplies));

  return (
    <div className="flex w-full min-w-0 flex-col">
      {/* Header: avatar (+ body-height spine) | content | menu */}
      <div className="flex w-full min-w-0 items-stretch gap-2 sm:gap-3">
        <div className={`${AVATAR_COL} shrink-0 flex flex-col items-center`}>
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
          {showBodySpine && (
            <div
              className="w-px flex-1 min-h-[4px] bg-border mt-1"
              aria-hidden
            />
          )}
        </div>

        <div className="flex flex-1 min-w-0 items-start gap-2 sm:gap-3">
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
                <ReactionsBar
                  resourceType={RESOURCE_TYPES.COMMENT}
                  resourceId={data.id}
                  reactions={data.reactions}
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

          {isOwner && !isEditing && (
            <div className="shrink-0 mt-0.5">{commentMenu()}</div>
          )}
        </div>
      </div>

      {/* Collapsed: YouTube "N replies" on the rail (creator avatar when they replied) */}
      {canNestReplies && !showReplies && hasReplies && (
        <div className="flex w-full min-w-0 items-stretch gap-2 sm:gap-3">
          <ThreadBranch isLast />
          <RepliesToggle
            count={displayReplyCount}
            expanded={false}
            creatorReply={creatorReply}
            onClick={() => setShowReplies(true)}
          />
        </div>
      )}

      {/* Expanded thread */}
      {canNestReplies && showReplies && (
        <div className="flex w-full flex-col">
          {repliesLoading && replies.length === 0 ? (
            <div className="flex items-stretch gap-2 sm:gap-3">
              <ThreadBranch isLast />
              <p className="text-xs text-muted-foreground pt-1">
                Loading replies…
              </p>
            </div>
          ) : replies.length === 0 ? (
            <div className="flex items-stretch gap-2 sm:gap-3">
              <ThreadBranch isLast />
              <div className="flex flex-col gap-1 pt-0.5">
                <p className="text-xs text-muted-foreground">No replies yet.</p>
                <RepliesToggle
                  count={0}
                  expanded
                  onClick={() => setShowReplies(false)}
                />
              </div>
            </div>
          ) : (
            <>
              {replies.map((reply, index) => {
                const isLast = index === replies.length - 1;
                return (
                  <div
                    key={reply.id}
                    className="flex w-full min-w-0 items-stretch gap-2 sm:gap-3"
                  >
                    <ThreadBranch isLast={isLast} />
                    {/*
                      Spacing on the content column (not the row) so the
                      stretched ThreadBranch spine fills the sibling gap.
                    */}
                    <div
                      className={`min-w-0 flex-1 ${isLast ? "" : "pb-3"}`}
                    >
                      <Comment
                        data={reply}
                        isOwner={currentUser?.id === reply.creator.id}
                        depth={Math.min(depth + 1, MAX_NEST_DEPTH)}
                      />
                    </div>
                  </div>
                );
              })}
              <div className="flex w-full min-w-0 items-center gap-2 sm:gap-3 pt-1">
                <div className={`${AVATAR_COL} shrink-0`} aria-hidden />
                <RepliesToggle
                  count={displayReplyCount}
                  expanded
                  creatorReply={creatorReply}
                  onClick={() => setShowReplies(false)}
                />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
