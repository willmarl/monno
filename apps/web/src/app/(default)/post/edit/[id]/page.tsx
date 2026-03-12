"use client";

import { useEffect } from "react";
import { PageLoadingState } from "@/components/common/PageLoadingState";
import UpdatePostForm from "@/features/posts/components/UpdatePostForm";
import { Card } from "@/components/ui/card";
import { useParams } from "next/navigation";
import { useSessionUser } from "@/features/auth/hooks";
import { usePostById } from "@/features/posts/hooks";
import { useRouter } from "next/navigation";

export default function page() {
  const { data: user, isLoading: loadingUser } = useSessionUser();
  const params = useParams<{ id: string }>();
  const { data: post, isLoading: loadingPost } = usePostById(Number(params.id));
  const router = useRouter();

  useEffect(() => {
    if (!loadingPost && !post) {
      router.push("/not-found");
    }
  }, [post, loadingPost, router]);

  useEffect(() => {
    if (!loadingUser && !loadingPost && post && user) {
      const isOwner = user.id === post.creator?.id;
      if (!isOwner) {
        router.push("/unauthorized");
      }
    }
  }, [user, loadingUser, post, loadingPost, router]);

  if (loadingUser || loadingPost) {
    return <PageLoadingState variant="card" />;
  }

  if (!post) {
    return null;
  }

  const isOwner = user?.id === post?.creator?.id;
  if (!isOwner) {
    return null;
  }

  return (
    <Card className="p-8 w-full max-w-md mx-auto">
      <UpdatePostForm post={post} />
    </Card>
  );
}
