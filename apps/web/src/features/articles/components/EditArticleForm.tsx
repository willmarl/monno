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
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { MediaManager, UnifiedMediaItem } from "@/components/ui/MediaManager";
import { Article, ArticleMedia, ARTICLE_STATUSES } from "../types/article";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

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

export function EditArticleForm({ articleData }: { articleData: Article }) {
  const sortedMedia = [...articleData.media].sort(
    (a, b) => a.sortOrder - b.sortOrder
  );

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

  const { formState: { isValid } } = form;
  const router = useRouter();
  const updateArticleMutation = useUpdateArticle();
  const addMedia = useAddArticleMedia(articleData.id);
  const removeMedia = useRemoveArticleMedia(articleData.id);
  const setPrimary = useSetArticleMediaPrimary(articleData.id);
  const reorderMedia = useReorderArticleMedia(articleData.id);

  function handleFilesDropped(files: File[]) {
    const newItems: UnifiedMediaItem[] = files.map((f) => ({
      kind: "queued",
      localId: crypto.randomUUID(),
      file: f,
      preview: URL.createObjectURL(f),
      isPrimary: false,
    }));
    setItems((prev) => [...prev, ...newItems].slice(0, MAX_FILES + prev.filter(i => i.kind === "existing" && i.pendingRemoval).length));
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

  async function onSubmit(data: UpdateArticleInput) {
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
        uploadedMedia = await addMedia.mutateAsync(
          queuedItems.map((i) => i.file)
        );
      }

      // Map localIds to real IDs for ordering and primary
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
      router.push(`/article/${articleData.id}`);
    } catch (error: any) {
      toast.error(`Error updating article. ${error?.message ?? "Unknown error"}`);
      setIsSubmitting(false);
    }
  }

  return (
    <div className="relative">
      {isSubmitting && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 rounded-lg">
          <div className="flex flex-col items-center gap-2 bg-card p-6 rounded-lg">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-sm text-muted-foreground">Saving changes...</p>
          </div>
        </div>
      )}

      <div
        className={`space-y-6 w-full max-w-sm ${isSubmitting ? "opacity-50 pointer-events-none" : ""}`}
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* content */}
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content</FormLabel>
                  <FormControl>
                    <Textarea placeholder="content" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* status */}
            <div className="space-y-2">
              <Label htmlFor="edit-status" className="text-sm">
                Status
              </Label>
              <Controller
                name="status"
                control={form.control}
                render={({ field }) => (
                  <Select value={field.value || ""} onValueChange={field.onChange}>
                    <SelectTrigger id="edit-status" disabled={isSubmitting}>
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

            {/* Media */}
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

            <Button
              type="submit"
              className="w-full cursor-pointer"
              disabled={isSubmitting || !isValid}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Update article"
              )}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
