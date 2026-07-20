"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  adminCreateArticleSchema,
  AdminCreateArticleInput,
} from "../schemas/adminCreateArticle.schema";
import { useAdminCreateArticle } from "../hooks";
import {
  addAdminArticleMedia,
  setAdminArticleMediaPrimary,
} from "../api";
import { ARTICLE_STATUSES } from "../types/article";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MediaManager, UnifiedMediaItem } from "@/components/ui/MediaManager";
import {
  validateQueuedFiles,
  revokeQueuedPreviews,
  createMediaHandlers,
  applyCreateMediaChanges,
} from "@/components/ui/media-utils";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const MAX_FILES = 3;

interface AdminCreateArticleFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  onError?: (error: any) => void;
  isAlwaysOpen?: boolean;
}

/**
 * Admin form for creating articles with optional media upload.
 *
 * Creates via POST /admin/articles (admin is creator), then uploads media
 * via admin media sub-routes. Does not redirect — caller handles toast/close
 * via onSuccess (typically a modal on the admin articles page).
 *
 * isAlwaysOpen=false renders a toggle button; true renders the form directly.
 */
export function AdminCreateArticleForm({
  onSuccess,
  onCancel,
  onError,
  isAlwaysOpen = false,
}: AdminCreateArticleFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<UnifiedMediaItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<AdminCreateArticleInput>({
    resolver: zodResolver(adminCreateArticleSchema),
    mode: "onChange",
    defaultValues: {
      title: "",
      content: "",
      status: "DRAFT",
    },
  });

  const { handleFilesDropped, handleRemove, handleSetPrimary } =
    createMediaHandlers(setItems, MAX_FILES);

  const createArticleMutation = useAdminCreateArticle();
  const { isValid } = form.formState;

  function handleReset() {
    revokeQueuedPreviews(items);
    setItems([]);
    form.reset();
  }

  async function handleSubmit(data: AdminCreateArticleInput) {
    if (!validateQueuedFiles(items)) {
      toast.error(
        "Some files have unsupported types. Remove them before submitting.",
      );
      return;
    }
    setIsSubmitting(true);
    try {
      const article = await createArticleMutation.mutateAsync(data);
      await applyCreateMediaChanges({
        items,
        addFn: (files) => addAdminArticleMedia(article.id, files),
        setPrimaryFn: (mediaId) =>
          setAdminArticleMediaPrimary(article.id, mediaId),
      });
      // Invalidate only after media is attached so the table doesn't flash "No image"
      await queryClient.invalidateQueries({ queryKey: ["admin-articles"] });
      handleReset();
      if (!isAlwaysOpen) setIsOpen(false);
      onSuccess?.();
    } catch (err: any) {
      onError?.(err);
      setIsSubmitting(false);
    }
  }

  if (!isAlwaysOpen && !isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)} variant="outline">
        Create Article
      </Button>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="admin-create-title" className="text-sm">
          Title
        </Label>
        <Input
          id="admin-create-title"
          type="text"
          placeholder="title"
          disabled={isSubmitting}
          {...form.register("title")}
        />
        {form.formState.errors.title && (
          <p className="text-xs text-red-500">
            {form.formState.errors.title.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="admin-create-content" className="text-sm">
          Content
        </Label>
        <Textarea
          id="admin-create-content"
          placeholder="content"
          disabled={isSubmitting}
          {...form.register("content")}
        />
        {form.formState.errors.content && (
          <p className="text-xs text-red-500">
            {form.formState.errors.content.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="admin-create-status" className="text-sm">
          Status
        </Label>
        <Controller
          name="status"
          control={form.control}
          render={({ field }) => (
            <Select value={field.value || ""} onValueChange={field.onChange}>
              <SelectTrigger id="admin-create-status" disabled={isSubmitting}>
                <SelectValue placeholder="Select a status" />
              </SelectTrigger>
              <SelectContent>
                {ARTICLE_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status.charAt(0).toUpperCase() +
                      status.slice(1).toLowerCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {form.formState.errors.status && (
          <p className="text-xs text-red-500">
            {form.formState.errors.status.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label className="text-sm">Media (optional)</Label>
        <MediaManager
          items={items}
          maxCount={MAX_FILES}
          isBusy={isSubmitting}
          onFilesDropped={handleFilesDropped}
          onRemove={handleRemove}
          onSetPrimary={handleSetPrimary}
          onReorder={setItems}
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
            handleReset();
            onCancel?.();
          }}
          disabled={isSubmitting}
        >
          {isAlwaysOpen ? "Reset" : "Cancel"}
        </Button>
        <Button
          type="submit"
          size="sm"
          className="cursor-pointer"
          disabled={isSubmitting || !isValid}
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSubmitting ? "Creating..." : "Create article"}
        </Button>
      </div>
    </form>
  );
}
