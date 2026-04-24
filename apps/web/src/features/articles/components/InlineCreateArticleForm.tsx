"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createArticleSchema,
  CreateArticleInput,
} from "../schemas/createArticle.schema";
import { useCreateArticle } from "../hooks";
import { addArticleMedia, setArticleMediaPrimary } from "../api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
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
import { ARTICLE_STATUSES } from "../types/article";
import { toast } from "sonner";

const MAX_FILES = 3;

interface InlineCreateArticleFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  onError?: (error: any) => void;
  isAlwaysOpen?: boolean;
}

export function InlineCreateArticleForm({
  onSuccess,
  onCancel,
  onError,
  isAlwaysOpen = false,
}: InlineCreateArticleFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<UnifiedMediaItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreateArticleInput>({
    resolver: zodResolver(createArticleSchema),
    mode: "onChange",
    defaultValues: {
      title: "",
      content: "",
      status: "DRAFT",
    },
  });

  const router = useRouter();
  const createArticleMutation = useCreateArticle();
  const { isValid } = form.formState;

  const { handleFilesDropped, handleRemove, handleSetPrimary } =
    createMediaHandlers(setItems, MAX_FILES);

  function handleReset() {
    revokeQueuedPreviews(items);
    setItems([]);
    form.reset();
  }

  async function handleSubmit(data: CreateArticleInput) {
    if (!validateQueuedFiles(items)) {
      toast.error("Some files have unsupported types. Remove them before submitting.");
      return;
    }
    setIsSubmitting(true);
    try {
      const article = await createArticleMutation.mutateAsync(data);
      await applyCreateMediaChanges({
        items,
        addFn: (files) => addArticleMedia(article.id, files),
        setPrimaryFn: (mediaId) => setArticleMediaPrimary(article.id, mediaId),
      });
      handleReset();
      if (!isAlwaysOpen) setIsOpen(false);
      router.push(`/article/${article.id}`);
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
        <Label htmlFor="inline-title" className="text-sm">Title</Label>
        <Input
          id="inline-title"
          type="text"
          placeholder="title"
          disabled={isSubmitting}
          {...form.register("title")}
        />
        {form.formState.errors.title && (
          <p className="text-xs text-red-500">{form.formState.errors.title.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="inline-content" className="text-sm">Content</Label>
        <Textarea
          id="inline-content"
          placeholder="content"
          disabled={isSubmitting}
          {...form.register("content")}
        />
        {form.formState.errors.content && (
          <p className="text-xs text-red-500">{form.formState.errors.content.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="inline-status" className="text-sm">Status</Label>
        <Controller
          name="status"
          control={form.control}
          render={({ field }) => (
            <Select value={field.value || ""} onValueChange={field.onChange}>
              <SelectTrigger id="inline-status" disabled={isSubmitting}>
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
