"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createArticleSchema,
  CreateArticleInput,
} from "../schemas/createArticle.schema";
import { useCreateArticle } from "../hooks";
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
import { FileDropzone } from "@/components/ui/file-dropzone";
import { ARTICLE_STATUSES } from "../types/article";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function CreateArticleForm() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

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
  const router = useRouter();
  const createArticleMutation = useCreateArticle();

  function onSubmit(data: CreateArticleInput) {
    createArticleMutation.mutate(
      { data, file: selectedFile ?? undefined },
      {
        onSuccess: (response) => {
          toast.success("Article created");
          router.push(`/article/${response?.id}`);
        },
        onError: (error) => {
          toast.error(`Error creating article. ${error.message}`);
        },
      },
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6 w-full max-w-sm"
      >
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
          <Label htmlFor="inline-status" className="text-sm">
            Status
          </Label>
          <Controller
            name="status"
            control={form.control}
            render={({ field }) => (
              <Select value={field.value || ""} onValueChange={field.onChange}>
                <SelectTrigger
                  id="inline-status"
                  disabled={createArticleMutation.isPending}
                >
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
          <Label className="text-sm">Featured Image (Optional)</Label>
          <FileDropzone
            preset="articleImage"
            onFileSelect={setSelectedFile}
            disabled={createArticleMutation.isPending}
            preview
          />
        </div>

        <Button
          type="submit"
          className="w-full cursor-pointer"
          disabled={createArticleMutation.isPending || !isValid}
        >
          {createArticleMutation.isPending ? "Creating..." : "Create article"}
        </Button>
      </form>
    </Form>
  );
}
