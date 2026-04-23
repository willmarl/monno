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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Article, ArticleMedia, ARTICLE_STATUSES } from "../types/article";
import { Textarea } from "@/components/ui/textarea";
import { MediaManager, UnifiedMediaItem } from "@/components/ui/MediaManager";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const MAX_FILES = 3;

function toUnified(m: ArticleMedia): UnifiedMediaItem {
  return {
    kind: "existing",
    localId: `e-${m.id}`,
    id: m.id,
    original: m.original,
    thumbnail: m.thumbnail,
    mimeType: m.mimeType,
    isPrimary: m.isPrimary,
    pendingRemoval: false,
  };
}

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
    (a, b) => a.sortOrder - b.sortOrder
  );

  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<UnifiedMediaItem[]>(() =>
    sortedMedia.map(toUnified)
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

  const updateArticleMutation = useUpdateArticle();
  const addMedia = useAddArticleMedia(articleData.id);
  const removeMedia = useRemoveArticleMedia(articleData.id);
  const setPrimary = useSetArticleMediaPrimary(articleData.id);
  const reorderMedia = useReorderArticleMedia(articleData.id);

  const { isValid } = form.formState;

  function handleFilesDropped(files: File[]) {
    const newItems: UnifiedMediaItem[] = files.map((f) => ({
      kind: "queued",
      localId: crypto.randomUUID(),
      file: f,
      preview: URL.createObjectURL(f),
      isPrimary: false,
    }));
    setItems((prev) =>
      [...prev, ...newItems].slice(
        0,
        MAX_FILES + prev.filter((i) => i.kind === "existing" && i.pendingRemoval).length
      )
    );
  }

  function handleRemove(localId: string) {
    setItems((prev) =>
      prev.flatMap((i) => {
        if (i.localId !== localId) return [i];
        if (i.kind === "queued") {
          URL.revokeObjectURL(i.preview);
          return [];
        }
        return [{ ...i, pendingRemoval: true, isPrimary: false }];
      })
    );
  }

  function handleUndoRemove(localId: string) {
    setItems((prev) =>
      prev.map((i) =>
        i.localId === localId && i.kind === "existing"
          ? { ...i, pendingRemoval: false }
          : i
      )
    );
  }

  function handleSetPrimary(localId: string) {
    setItems((prev) =>
      prev.map((i) => ({ ...i, isPrimary: i.localId === localId }))
    );
  }

  async function handleSubmit(data: UpdateArticleInput) {
    setIsSubmitting(true);
    try {
      await updateArticleMutation.mutateAsync({ id: articleData.id, data });

      const toDelete = items.filter(
        (i): i is Extract<UnifiedMediaItem, { kind: "existing" }> =>
          i.kind === "existing" && i.pendingRemoval
      );
      const activeItems = items.filter(
        (i) => !(i.kind === "existing" && i.pendingRemoval)
      );
      const queuedItems = activeItems.filter(
        (i): i is Extract<UnifiedMediaItem, { kind: "queued" }> =>
          i.kind === "queued"
      );
      const existingActive = activeItems.filter(
        (i): i is Extract<UnifiedMediaItem, { kind: "existing" }> =>
          i.kind === "existing"
      );

      for (const item of toDelete) {
        await removeMedia.mutateAsync(item.id);
      }

      let uploadedMedia: ArticleMedia[] = [];
      if (queuedItems.length > 0) {
        uploadedMedia = await addMedia.mutateAsync(queuedItems.map((i) => i.file));
      }

      const localIdToRealId = new Map<string, number>();
      existingActive.forEach((i) => localIdToRealId.set(i.localId, i.id));
      queuedItems.forEach((item, idx) => {
        if (uploadedMedia[idx]) localIdToRealId.set(item.localId, uploadedMedia[idx].id);
      });

      const finalIds = activeItems
        .map((i) => localIdToRealId.get(i.localId))
        .filter((id): id is number => id !== undefined);

      if (finalIds.length > 1) {
        const originalActiveIds = sortedMedia
          .filter((m) => !toDelete.some((d) => d.id === m.id))
          .map((m) => m.id);
        const existingNewOrder = existingActive.map((i) => i.id);
        const orderChanged =
          JSON.stringify(originalActiveIds) !== JSON.stringify(existingNewOrder);
        if (orderChanged || uploadedMedia.length > 0) {
          await reorderMedia.mutateAsync(finalIds);
        }
      }

      const primaryItem = activeItems.find((i) => i.isPrimary);
      const originalPrimaryId = sortedMedia.find((m) => m.isPrimary)?.id;
      const newPrimaryId = primaryItem
        ? localIdToRealId.get(primaryItem.localId)
        : undefined;
      if (newPrimaryId !== undefined && newPrimaryId !== originalPrimaryId) {
        await setPrimary.mutateAsync(newPrimaryId);
      }

      items
        .filter((i) => i.kind === "queued")
        .forEach((i) => {
          if (i.kind === "queued") URL.revokeObjectURL(i.preview);
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
        <Label htmlFor="inline-edit-title" className="text-sm">Title</Label>
        <Input
          id="inline-edit-title"
          type="text"
          placeholder="title"
          disabled={isSubmitting}
          {...form.register("title")}
        />
        {form.formState.errors.title && (
          <p className="text-xs text-red-500">{form.formState.errors.title.message}</p>
        )}
      </div>

      {/* content */}
      <div className="space-y-2">
        <Label htmlFor="inline-edit-content" className="text-sm">Content</Label>
        <Textarea
          id="inline-edit-content"
          placeholder="content"
          disabled={isSubmitting}
          {...form.register("content")}
        />
        {form.formState.errors.content && (
          <p className="text-xs text-red-500">{form.formState.errors.content.message}</p>
        )}
      </div>

      {/* status */}
      <div className="space-y-2">
        <Label htmlFor="inline-edit-status" className="text-sm">Status</Label>
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
                    {status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {form.formState.errors.status && (
          <p className="text-xs text-red-500">{form.formState.errors.status.message}</p>
        )}
      </div>

      {/* media */}
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

      {/* Action Buttons */}
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
