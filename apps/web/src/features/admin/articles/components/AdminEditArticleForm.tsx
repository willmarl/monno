"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  adminUpdateArticleSchema,
  AdminUpdateArticleInput,
} from "../schemas/adminUpdateArticle.schema";
import {
  useAdminUpdateArticle,
  useAddAdminArticleMedia,
  useRemoveAdminArticleMedia,
  useSetAdminArticleMediaPrimary,
  useReorderAdminArticleMedia,
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
import {
  toUnified,
  validateQueuedFiles,
  createMediaHandlers,
  applyMediaChanges,
} from "@/components/ui/media-utils";
import { Article, ARTICLE_STATUSES } from "../types/article";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

const MAX_FILES = 3;

export function AdminEditArticleForm({ articleData }: { articleData: Article }) {
  const sortedMedia = [...articleData.media].sort((a, b) => a.sortOrder - b.sortOrder);

  const [items, setItems] = useState<UnifiedMediaItem[]>(() => sortedMedia.map(toUnified));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AdminUpdateArticleInput>({
    resolver: zodResolver(adminUpdateArticleSchema),
    mode: "onChange",
    defaultValues: {
      title: articleData.title,
      content: articleData.content,
      status: articleData.status,
    },
  });

  const { formState: { isValid } } = form;
  const router = useRouter();
  const updateArticleMutation = useAdminUpdateArticle();
  const addMedia = useAddAdminArticleMedia(articleData.id);
  const removeMedia = useRemoveAdminArticleMedia(articleData.id);
  const setPrimary = useSetAdminArticleMediaPrimary(articleData.id);
  const reorderMedia = useReorderAdminArticleMedia(articleData.id);

  const { handleFilesDropped, handleRemove, handleUndoRemove, handleSetPrimary } =
    createMediaHandlers(setItems, MAX_FILES);

  async function onSubmit(data: AdminUpdateArticleInput) {
    if (!validateQueuedFiles(items)) {
      toast.error("Some files have unsupported types. Remove them before submitting.");
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

      <div className={`space-y-6 w-full max-w-sm ${isSubmitting ? "opacity-50 pointer-events-none" : ""}`}>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl><Input placeholder="title" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content</FormLabel>
                  <FormControl><Textarea placeholder="content" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <Label htmlFor="admin-edit-status" className="text-sm">Status</Label>
              <Controller
                name="status"
                control={form.control}
                render={({ field }) => (
                  <Select value={field.value || ""} onValueChange={field.onChange}>
                    <SelectTrigger id="admin-edit-status" disabled={isSubmitting}>
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
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</>
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
