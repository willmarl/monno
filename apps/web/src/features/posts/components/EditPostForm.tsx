"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updatePostSchema, UpdatePostInput } from "../schemas/updatePost.schema";
import { useUpdatePost } from "../hooks";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Post } from "../types/post";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Controller } from "react-hook-form";

interface EditPostFormProps {
  post: Post;
  onSuccess?: () => void;
  onCancel?: () => void;
  isAlwaysOpen?: boolean;
}

/**
 * Form for editing posts. Importer must handle:
 * - Success toast via onSuccess callback
 * - Navigation/redirect via onSuccess callback
 *
 * isAlwaysOpen=false: renders as toggle button.
 * isAlwaysOpen=true: renders form immediately (pages/modals).
 */
export function EditPostForm({
  post,
  onSuccess,
  onCancel,
  isAlwaysOpen = false,
}: EditPostFormProps) {
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm<UpdatePostInput>({
    resolver: zodResolver(updatePostSchema),
    mode: "onChange",
    defaultValues: {
      title: post.title,
      content: post.content,
      visibility: post.visibility ?? "PUBLIC",
    },
  });

  const {
    formState: { isValid },
  } = form;
  const updatePostMutation = useUpdatePost();

  function onSubmit(data: UpdatePostInput) {
    updatePostMutation.mutate(
      { id: post.id, data },
      {
        onSuccess: () => {
          form.reset({
            title: data.title,
            content: data.content,
            visibility: data.visibility,
          });
          if (!isAlwaysOpen) setIsOpen(false);
          onSuccess?.();
        },
        onError: (err: any) => {
          toast.error(err?.message ?? "Failed to update post");
        },
      },
    );
  }

  if (!isAlwaysOpen && !isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)} variant="outline">
        Edit Post
      </Button>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label className="text-sm">Title</Label>
        <Input placeholder="title" {...form.register("title")} />
        {form.formState.errors.title && (
          <p className="text-xs text-red-500">
            {form.formState.errors.title.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label className="text-sm">Content</Label>
        <Textarea placeholder="content" {...form.register("content")} />
        {form.formState.errors.content && (
          <p className="text-xs text-red-500">
            {form.formState.errors.content.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label className="text-sm">Visibility</Label>
        <Controller
          control={form.control}
          name="visibility"
          render={({ field }) => (
            <Select
              value={field.value ?? "PUBLIC"}
              onValueChange={field.onChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Visibility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PUBLIC">Public</SelectItem>
                <SelectItem value="PRIVATE">Private</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="cursor-pointer"
          onClick={() => {
            if (!isAlwaysOpen) setIsOpen(false);
            form.reset();
            onCancel?.();
          }}
          disabled={updatePostMutation.isPending}
        >
          {isAlwaysOpen ? "Reset" : "Cancel"}
        </Button>
        <Button
          type="submit"
          size="sm"
          className="cursor-pointer"
          disabled={updatePostMutation.isPending || !isValid}
        >
          {updatePostMutation.isPending ? "Saving..." : "Save Post"}
        </Button>
      </div>
    </form>
  );
}
