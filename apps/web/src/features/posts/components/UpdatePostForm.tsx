"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  updatePostSchema,
  UpdatePostInput,
} from "../schemas/updatePost.schema";
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
import { useSessionUser } from "@/features/auth/hooks";
import { Spinner } from "@/components/ui/spinner";

export default function UpdatePostForm({ postId }: { postId: number }) {
  const router = useRouter();
  const { data: user } = useSessionUser();
  const { data: post, isLoading: postLoading } = usePostById(postId);
  const isOwner = user?.id === post?.creator?.id;
  if (!isOwner && !postLoading) {
    router.push(`/unauthorized`);
  }

  const form = useForm<UpdatePostInput>({
    resolver: zodResolver(updatePostSchema),
    mode: "onChange",
  });

  const {
    formState: { isValid },
  } = form;
  const updatePostMutation = useUpdatePost();

  function onSubmit(data: UpdatePostInput) {
    updatePostMutation.mutate(
      { id: postId, data },
      {
        onSuccess: () => {
          toast.success("Post updated");
          router.push(`/posts/${postId}`);
        },
      }
    );
  }

  if (postLoading) {
    return (
      <div className="flex justify-center items-center">
        <Spinner />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6 w-full max-w-sm"
      >
        {/* use code snippet: shad-input */}
        {/* title */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Update Title</FormLabel>

              <FormControl>
                <Input
                  placeholder="title"
                  defaultValue={post?.title}
                  {...field}
                />
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
              <FormLabel>Update Content</FormLabel>

              <FormControl>
                <Textarea
                  defaultValue={post?.content}
                  placeholder="content"
                  {...field}
                />
              </FormControl>

              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full"
          disabled={updatePostMutation.isPending || !isValid}
        >
          {updatePostMutation.isPending ? "Updating..." : "Update Post"}
        </Button>
      </form>
    </Form>
  );
}
