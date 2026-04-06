"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  editPostSchema,
  EditPostInput,
} from "../schemas/editPost.schema";
import { useUpdatePost, usePostById } from "../hooks";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Post } from "../types/post";

export default function EditPostForm({ post }: { post: Post }) {
  const router = useRouter();

  const form = useForm<EditPostInput>({
    resolver: zodResolver(editPostSchema),
    mode: "onChange",
    defaultValues: {
      title: post.title,
      content: post.content,
    },
  });

  const {
    formState: { isValid },
  } = form;
  const updatePostMutation = useUpdatePost();

  function onSubmit(data: EditPostInput) {
    updatePostMutation.mutate(
      { id: post.id, data },
      {
        onSuccess: () => {
          toast.success("Post updated");
          router.push(`/post/${post.id}`);
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
              <FormLabel>Edit Title</FormLabel>

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
              <FormLabel>Edit Content</FormLabel>

              <FormControl>
                <Textarea placeholder="content" {...field} />
              </FormControl>

              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full cursor-pointer"
          disabled={updatePostMutation.isPending || !isValid}
        >
          {updatePostMutation.isPending ? "Saving..." : "Save Post"}
        </Button>
      </form>
    </Form>
  );
}
