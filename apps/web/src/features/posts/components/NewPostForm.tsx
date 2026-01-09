"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { newPostSchema, NewPostInput } from "../schemas/newPost.schema";
import { useCreatePost } from "../hooks";
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
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function NewPostForm() {
  const router = useRouter();
  const form = useForm<NewPostInput>({
    resolver: zodResolver(newPostSchema),
    mode: "onChange",
  });

  const {
    formState: { isValid },
  } = form;
  const newPostMutation = useCreatePost();

  function onSubmit(data: NewPostInput) {
    newPostMutation.mutate(data, {
      onSuccess: (response) => {
        toast.success("Post created");
        router.push(`/post/${response.id}`); // assuming response has an id
      },
    });
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
              <FormLabel>Post Title</FormLabel>

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
              <FormLabel>Post Content</FormLabel>

              <FormControl>
                <Textarea placeholder="content" {...field} />
              </FormControl>

              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full"
          disabled={newPostMutation.isPending || !isValid}
        >
          {newPostMutation.isPending ? "Creating..." : "Create Post"}
        </Button>
      </form>
    </Form>
  );
}
