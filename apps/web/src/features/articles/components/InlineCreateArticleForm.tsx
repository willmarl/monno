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
import { MediaManager, UnifiedMediaItem, ALLOWED_IMAGE_TYPES } from "@/components/ui/MediaManager";
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

  function handleFilesDropped(files: File[]) {
    const newItems: UnifiedMediaItem[] = files.map((f) => ({
      kind: "queued",
      localId: crypto.randomUUID(),
      file: f,
      preview: URL.createObjectURL(f),
      isPrimary: false,
    }));
    setItems((prev) => [...prev, ...newItems].slice(0, MAX_FILES));
  }

  function handleRemove(localId: string) {
    setItems((prev) => {
      const item = prev.find((i) => i.localId === localId);
      if (item?.kind === "queued") URL.revokeObjectURL(item.preview);
      return prev.filter((i) => i.localId !== localId);
    });
  }

  function handleSetPrimary(localId: string) {
    setItems((prev) =>
      prev.map((i) => ({ ...i, isPrimary: i.localId === localId }))
    );
  }

  function handleReset() {
    items.forEach((i) => {
      if (i.kind === "queued") URL.revokeObjectURL(i.preview);
    });
    setItems([]);
    form.reset();
  }

  async function handleSubmit(data: CreateArticleInput) {
    const invalid = items.filter(
      (i) => i.kind === "queued" && !ALLOWED_IMAGE_TYPES.includes(i.file.type as any)
    );
    if (invalid.length > 0) {
      toast.error("Some files have unsupported types. Remove them before submitting.");
      return;
    }

    setIsSubmitting(true);
    try {
      const article = await createArticleMutation.mutateAsync(data);

      if (items.length > 0) {
        const uploaded = await addArticleMedia(
          article.id,
          items.map((i) => (i.kind === "queued" ? i.file : null!)).filter(Boolean)
        );
        const primaryIdx = items.findIndex((i) => i.isPrimary);
        if (primaryIdx >= 0 && uploaded[primaryIdx]) {
          await setArticleMediaPrimary(article.id, uploaded[primaryIdx].id);
        }
      }

      items.forEach((i) => {
        if (i.kind === "queued") URL.revokeObjectURL(i.preview);
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
      {/* title */}
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

      {/* content */}
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

      {/* status */}
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

      {/* Media */}
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

      {/* Action Buttons */}
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
