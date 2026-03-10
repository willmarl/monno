"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  UpdateCommentAdminInput,
  updateCommentAdminSchema,
} from "../schemas/updateCommentAdmin.schema";
import { useAdminUpdateComment } from "@/features/comments/hooks";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { Comment } from "@/features/comments/types/comment";

interface InlineUpdateCommentAdminFormProps {
  data: Comment;
  onSuccess?: () => void;
  onCancel?: () => void;
  onError?: (error: any) => void;
  isAlwaysOpen?: boolean;
}

export function InlineUpdateCommentAdminForm({
  data: commentData,
  onSuccess,
  onCancel,
  onError,
  isAlwaysOpen = false,
}: InlineUpdateCommentAdminFormProps) {
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm<UpdateCommentAdminInput>({
    resolver: zodResolver(updateCommentAdminSchema),
    mode: "onChange",
    defaultValues: {
      content: commentData.content,
    },
  });

  const updateCommentAdminMutation = useAdminUpdateComment();

  const { isValid } = form.formState;

  const handleSubmit = (data: UpdateCommentAdminInput) => {
    updateCommentAdminMutation.mutate(
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
        Change UpdateCommentAdmin
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
          disabled={updateCommentAdminMutation.isPending}
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
          disabled={updateCommentAdminMutation.isPending}
        >
          {isAlwaysOpen ? "Reset" : "Cancel"}
        </Button>
        <Button
          type="submit"
          size="sm"
          className="cursor-pointer"
          disabled={updateCommentAdminMutation.isPending || !isValid}
        >
          {updateCommentAdminMutation.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {updateCommentAdminMutation.isPending
            ? "Updating..."
            : "Update comment"}
        </Button>
      </div>
    </form>
  );
}
