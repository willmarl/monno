"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  EditCommentAdminInput,
  editCommentAdminSchema,
} from "../schemas/editCommentAdmin.schema";
import { useAdminUpdateComment } from "@/features/comments/hooks";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { Comment } from "@/features/comments/types/comment";

interface InlineEditCommentAdminFormProps {
  data: Comment;
  onSuccess?: () => void;
  onCancel?: () => void;
  onError?: (error: any) => void;
  isAlwaysOpen?: boolean;
}

export function InlineEditCommentAdminForm({
  data: commentData,
  onSuccess,
  onCancel,
  onError,
  isAlwaysOpen = false,
}: InlineEditCommentAdminFormProps) {
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm<EditCommentAdminInput>({
    resolver: zodResolver(editCommentAdminSchema),
    mode: "onChange",
    defaultValues: {
      content: commentData.content,
    },
  });

  const editCommentAdminMutation = useAdminUpdateComment();

  const { isValid } = form.formState;

  const handleSubmit = (data: EditCommentAdminInput) => {
    editCommentAdminMutation.mutate(
      { id: commentData.id, data },
      {
        onSuccess: () => {
          form.reset();
          if (!isAlwaysOpen) {
            setIsOpen(false);
          }
          onSuccess?.();
        },
        onError: (err) => {
          onError?.(err);
        },
      },
    );
  };

  if (!isAlwaysOpen && !isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)} variant="outline">
        Edit Comment
      </Button>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
      {/* content */}
      <div className="space-y-2">
        <Label htmlFor="inline-content" className="text-sm">
          Content
        </Label>
        <Input
          id="inline-content"
          type="text"
          placeholder="content"
          disabled={editCommentAdminMutation.isPending}
          {...form.register("content")}
        />
        {form.formState.errors.content && (
          <p className="text-xs text-red-500">
            {form.formState.errors.content.message}
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="cursor-pointer"
          onClick={() => {
            if (!isAlwaysOpen) {
              setIsOpen(false);
            }
            form.reset();
            onCancel?.();
          }}
          disabled={editCommentAdminMutation.isPending}
        >
          {isAlwaysOpen ? "Reset" : "Cancel"}
        </Button>
        <Button
          type="submit"
          size="sm"
          className="cursor-pointer"
          disabled={editCommentAdminMutation.isPending || !isValid}
        >
          {editCommentAdminMutation.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {editCommentAdminMutation.isPending ? "Saving..." : "Save comment"}
        </Button>
      </div>
    </form>
  );
}
