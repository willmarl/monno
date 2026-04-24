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
import { ARTICLE_STATUSES } from "../types/article";
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
  validateQueuedFiles,
  createMediaHandlers,
  applyCreateMediaChanges,
} from "@/components/ui/media-utils";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const MAX_FILES = 3;

export function CreateArticleForm() {
  const [items, setItems] = useState<UnifiedMediaItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { handleFilesDropped, handleRemove, handleSetPrimary } =
    createMediaHandlers(setItems, MAX_FILES);

  const form = useForm<CreateArticleInput>({
    resolver: zodResolver(createArticleSchema),
    mode: "onChange",
    defaultValues: {
      title: "",
      content: "",
      status: "DRAFT",
    },
  });

  const {
    formState: { isValid },
  } = form;
  const createArticleMutation = useCreateArticle();

  async function onSubmit(data: CreateArticleInput) {
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
        addFn: (files) => addArticleMedia(article.id, files),
        setPrimaryFn: (mediaId) => setArticleMediaPrimary(article.id, mediaId),
      });
      toast.success("Article created");
      router.push(`/article/${article.id}`);
    } catch (error: any) {
      toast.error(`Error: ${error?.message ?? "Unknown error"}`);
      setIsSubmitting(false);
    }
  }

  return (
    <div className="relative">
      {isSubmitting && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 rounded-lg">
          <div className="flex flex-col items-center gap-2 bg-card p-6 rounded-lg">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-sm text-muted-foreground">Creating article...</p>
          </div>
        </div>
      )}

      <div
        className={`space-y-6 w-full max-w-2xl ${isSubmitting ? "opacity-50 pointer-events-none" : ""}`}
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
              <Label htmlFor="create-status" className="text-sm">
                Status
              </Label>
              <Controller
                name="status"
                control={form.control}
                render={({ field }) => (
                  <Select
                    value={field.value || ""}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger id="create-status" disabled={isSubmitting}>
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

            <Button
              type="submit"
              className="w-full cursor-pointer"
              disabled={isSubmitting || !isValid}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create article"
              )}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
