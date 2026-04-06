"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  editPostAdminSchema,
  EditPostAdminInput,
} from "../schemas/editPostAdmin.schema";
import { useAdminUpdatePost } from "@/features/posts/hooks";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { Post } from "@/features/posts/types/post";

interface InlineEditPostAdminFormProps {
  data: Post;
  onSuccess?: () => void;
  onCancel?: () => void;
  onError?: (error: any) => void;
  isAlwaysOpen?: boolean;
}

export function InlineEditPostAdminForm({
  data: postData,
  onSuccess,
  onCancel,
  onError,
  isAlwaysOpen = false,
}: InlineEditPostAdminFormProps) {
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm<EditPostAdminInput>({
    resolver: zodResolver(editPostAdminSchema),
    mode: "onChange",
    defaultValues: {
      title: postData.title,
      content: postData.content,
    },
  });

  const updatePostAdminMutation = useAdminUpdatePost();

  const { isValid } = form.formState;

  const handleSubmit = (data: EditPostAdminInput) => {
    updatePostAdminMutation.mutate(
      { id: postData.id, data },
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
        Edit Post
      </Button>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
      {/* title */}
      <div className="space-y-2">
        <Label htmlFor="inline-title" className="text-sm">
          Title
        </Label>
        <Input
          id="inline-title"
          type="text"
          placeholder="title"
          disabled={updatePostAdminMutation.isPending}
          {...form.register("title")}
        />
        {form.formState.errors.title && (
          <p className="text-xs text-red-500">
            {form.formState.errors.title.message}
          </p>
        )}
      </div>

      {/* content */}
      <div className="space-y-2">
        <Label htmlFor="inline-content" className="text-sm">
          Content
        </Label>
        <Input
          id="inline-content"
          type="text"
          placeholder="content"
          disabled={updatePostAdminMutation.isPending}
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
          disabled={updatePostAdminMutation.isPending}
        >
          {isAlwaysOpen ? "Reset" : "Cancel"}
        </Button>
        <Button
          type="submit"
          size="sm"
          className="cursor-pointer"
          disabled={updatePostAdminMutation.isPending || !isValid}
        >
          {updatePostAdminMutation.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {updatePostAdminMutation.isPending ? "Saving..." : "Save post"}
        </Button>
      </div>
    </form>
  );
}
