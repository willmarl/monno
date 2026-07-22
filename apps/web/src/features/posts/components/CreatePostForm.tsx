"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createPostSchema, CreatePostInput } from "../schemas/createPost.schema";
import { useCreatePost } from "../hooks";
import { usePostHogEvents } from "@/hooks/usePostHogEvents";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Controller } from "react-hook-form";

interface CreatePostFormProps {
  onSuccess?: (postId: number) => void;
  onCancel?: () => void;
  isAlwaysOpen?: boolean;
}

/**
 * Form for creating posts. Importer must handle:
 * - Success toast via onSuccess callback
 * - Navigation/redirect via onSuccess callback (receives postId)
 *
 * isAlwaysOpen=false: renders as toggle button.
 * isAlwaysOpen=true: renders form immediately (pages/modals).
 */
export function CreatePostForm({
  onSuccess,
  onCancel,
  isAlwaysOpen = false,
}: CreatePostFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { captureEvent } = usePostHogEvents();

  const form = useForm<CreatePostInput>({
    resolver: zodResolver(createPostSchema),
    mode: "onChange",
    defaultValues: {
      title: "",
      content: "",
      visibility: "PUBLIC",
    },
  });

  const {
    formState: { isValid },
  } = form;
  const createPostMutation = useCreatePost();

  function onSubmit(data: CreatePostInput) {
    createPostMutation.mutate(data, {
      onSuccess: (response) => {
        captureEvent("post_created", {
          postId: response.id,
          titleLength: data.title.length,
          contentLength: data.content.length,
        });
        form.reset();
        if (!isAlwaysOpen) setIsOpen(false);
        onSuccess?.(response.id);
      },
      onError: (err: any) => {
        toast.error(err?.message ?? "Failed to create post");
      },
    });
  }

  if (!isAlwaysOpen && !isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)} variant="outline">
        Create Post
      </Button>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label className="text-sm">Post Title</Label>
        <Input placeholder="title" {...form.register("title")} />
        {form.formState.errors.title && (
          <p className="text-xs text-red-500">
            {form.formState.errors.title.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label className="text-sm">Post Content</Label>
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
            <Select value={field.value} onValueChange={field.onChange}>
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
          disabled={createPostMutation.isPending}
        >
          {isAlwaysOpen ? "Reset" : "Cancel"}
        </Button>
        <Button
          type="submit"
          size="sm"
          className="cursor-pointer"
          disabled={createPostMutation.isPending || !isValid}
        >
          {createPostMutation.isPending ? "Creating..." : "Create Post"}
        </Button>
      </div>
    </form>
  );
}
