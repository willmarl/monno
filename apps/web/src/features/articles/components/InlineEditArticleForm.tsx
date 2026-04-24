"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  updateArticleSchema,
  UpdateArticleInput,
} from "../schemas/updateArticle.schema";
import { useUpdateArticle } from "../hooks";
import {
  useAddArticleMedia,
  useRemoveArticleMedia,
  useSetArticleMediaPrimary,
  useReorderArticleMedia,
} from "../hooks";
import { Article, ARTICLE_STATUSES } from "../types/article";
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
  toUnified,
  validateQueuedFiles,
  createMediaHandlers,
  applyMediaChanges,
} from "@/components/ui/media-utils";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
const MAX_FILES = 3;

interface InlineUpdateArticleFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  onError?: (error: any) => void;
  isAlwaysOpen?: boolean;
  articleData: Article;
}

export function InlineEditArticleForm({
  onSuccess,
  onCancel,
  onError,
  isAlwaysOpen = false,
  articleData,
}: InlineUpdateArticleFormProps) {
  const sortedMedia = [...articleData.media].sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );

  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<UnifiedMediaItem[]>(() =>
    sortedMedia.map(toUnified),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<UpdateArticleInput>({
    resolver: zodResolver(updateArticleSchema),
    mode: "onChange",
    defaultValues: {
      title: articleData.title,
      content: articleData.content,
      status: articleData.status,
    },
  });

  const { isValid } = form.formState;
  const {
    handleFilesDropped,
    handleRemove,
    handleUndoRemove,
    handleSetPrimary,
  } = createMediaHandlers(setItems, MAX_FILES);

  const updateArticleMutation = useUpdateArticle();
  const addMedia = useAddArticleMedia(articleData.id);
  const removeMedia = useRemoveArticleMedia(articleData.id);
  const setPrimary = useSetArticleMediaPrimary(articleData.id);
  const reorderMedia = useReorderArticleMedia(articleData.id);

  async function handleSubmit(data: UpdateArticleInput) {
    if (!validateQueuedFiles(items)) {
      toast.error(
        "Some files have unsupported types. Remove them before submitting.",
      );
      return;
    }
    setIsSubmitting(true);
    try {
      await updateArticleMutation.mutateAsync({ id: articleData.id, data });
      await applyMediaChanges({
        items,
        sortedMedia,
        addFn: (files) => addMedia.mutateAsync(files),
        removeFn: (id) => removeMedia.mutateAsync(id),
        setPrimaryFn: (id) => setPrimary.mutateAsync(id),
        reorderFn: (ids) => reorderMedia.mutateAsync(ids),
      });
      toast.success("Article updated");
      setIsSubmitting(false);
      form.reset();
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
        Edit Article
      </Button>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
      {/* title */}
      <div className="space-y-2">
        <Label htmlFor="inline-edit-title" className="text-sm">
          Title
        </Label>
        <Input
          id="inline-edit-title"
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

      {/* content */}
      <div className="space-y-2">
        <Label htmlFor="inline-edit-content" className="text-sm">
          Content
        </Label>
        <Textarea
          id="inline-edit-content"
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

      {/* status */}
      <div className="space-y-2">
        <Label htmlFor="inline-edit-status" className="text-sm">
          Status
        </Label>
        <Controller
          name="status"
          control={form.control}
          render={({ field }) => (
            <Select value={field.value || ""} onValueChange={field.onChange}>
              <SelectTrigger id="inline-edit-status" disabled={isSubmitting}>
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

      {/* file upload */}
      <div className="space-y-2">
        <Label className="text-sm">Media</Label>
        <MediaManager
          items={items}
          maxCount={MAX_FILES}
          isBusy={false}
          onFilesDropped={handleFilesDropped}
          onRemove={handleRemove}
          onUndoRemove={handleUndoRemove}
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
            form.reset();
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
          {isSubmitting ? "Updating..." : "Update article"}
        </Button>
      </div>
    </form>
  );
}
