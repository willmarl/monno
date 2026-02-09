"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { commentSchema, CommentInput } from "../schemas/comment.schema";
import { useCreateComment } from "../hooks";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, X } from "lucide-react";
import { User as UserType } from "@/features/users/types/user";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import type { ResourceType } from "@/types/resource";

interface InlineCommentFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  isAlwaysOpen?: boolean;
  resourceType: ResourceType;
  resourceId: number;
  user?: UserType;
}

export function InlineCommentForm({
  onSuccess,
  onCancel,
  isAlwaysOpen = true,
  resourceType,
  resourceId,
  user,
}: InlineCommentFormProps) {
  const [isOpen, setIsOpen] = useState(isAlwaysOpen);
  const [isFocused, setIsFocused] = useState(false);

  const form = useForm<CommentInput>({
    resolver: zodResolver(commentSchema),
    mode: "onChange",
  });

  const commentMutation = useCreateComment();
  const contentValue = form.watch("content");
  const { isValid } = form.formState;
  const showActions = isFocused || (contentValue && contentValue.length > 0);

  const handleSubmit = (data: CommentInput) => {
    const completeData = {
      ...data,
      resourceType: resourceType,
      resourceId: resourceId,
    };
    commentMutation.mutate(completeData, {
      onSuccess: () => {
        form.reset();
        setIsFocused(false);
        if (!isAlwaysOpen) {
          setIsOpen(false);
        }
        onSuccess?.();
      },
    });
  };

  if (!isAlwaysOpen && !isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)} variant="outline">
        Add Comment
      </Button>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <form
      onSubmit={form.handleSubmit(handleSubmit)}
      className="mt-6 border-t pt-4"
    >
      <div className="flex gap-4">
        {/* Avatar - Left Side */}
        <Avatar className="h-10 w-10 flex-shrink-0 mt-1">
          <AvatarImage src={user.avatarPath || undefined} alt={user.username} />
          <AvatarFallback>
            {user.username?.[0]?.toUpperCase() || "?"}
          </AvatarFallback>
        </Avatar>

        {/* Comment Input - Right Side */}
        <div className="flex-1">
          <Textarea
            id="inline-content"
            placeholder="Add a comment..."
            disabled={commentMutation.isPending}
            className="resize-none min-h-[36px] p-3 text-sm"
            {...form.register("content", {
              onBlur: () => {
                if (!contentValue) {
                  setIsFocused(false);
                }
              },
            })}
            onFocus={() => setIsFocused(true)}
          />
          {form.formState.errors.content && (
            <p className="text-xs text-red-500 mt-1">
              {form.formState.errors.content.message}
            </p>
          )}

          {/* Action Buttons - Only Show When Active */}
          {showActions && (
            <div className="flex gap-2 pt-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  form.reset();
                  setIsFocused(false);
                  onCancel?.();
                }}
                disabled={commentMutation.isPending}
                className="h-8"
              >
                <X size={16} className="mr-1" />
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={commentMutation.isPending || !isValid}
                className="h-8"
              >
                {commentMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {commentMutation.isPending ? "Posting..." : "Comment"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </form>
  );
}
