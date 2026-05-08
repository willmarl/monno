"use client";

import { CreatePostForm } from "@/features/posts/components/CreatePostForm";
import { Card } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function CreatePostPage() {
  const router = useRouter();

  return (
    <Card className="p-8 w-full max-w-md mx-auto">
      <CreatePostForm
        isAlwaysOpen={true}
        onSuccess={(postId) => {
          toast.success("Post created");
          router.push(`/post/${postId}`);
        }}
      />
    </Card>
  );
}
