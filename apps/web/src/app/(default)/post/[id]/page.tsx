"use client";

import { Post } from "@/components/ui/Post";
import { usePostById } from "@/features/posts/hooks";
import { useSessionUser } from "@/features/auth/hooks";
import { useRecordView } from "@/features/views/hook";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import { PageNotFound } from "@/components/common/PageNotFound";
import { PageLoadingState } from "@/components/common/PageLoadingState";
import { InlineCommentForm } from "@/features/comments/components/InlineCommentForm";
import { CommentPagInline } from "@/components/pages/post/CommnetPagInline";
import { toast } from "sonner";
import { Suspense } from "react";

export default function page() {
  const params = useParams();
  const postId = Number(params.id);
  const { data, isLoading, error } = usePostById(postId);
  const { data: user } = useSessionUser();
  const { mutate: recordView } = useRecordView();
  const isOwner = data?.creator.id === user?.id;

  useEffect(() => {
    document.title = `${data?.title} | ${process.env.NEXT_PUBLIC_APP_NAME}`;
  }, [data?.title]);

  // Record view when post loads
  useEffect(() => {
    if (data?.id) {
      recordView({
        resourceType: "POST",
        resourceId: data.id,
      });
    }
  }, [data?.id, recordView]);

  if (isLoading) {
    return <PageLoadingState variant="post" />;
  }

  if (error || !data) {
    return <PageNotFound title="Post Not Found" />;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Post
        data={data}
        isOwner={isOwner}
        truncateTitle={false}
        truncateContent={false}
      />
      <div className="bg-card rounded-lg p-4">
        <h3 className="font-semibold mb-4">Comments</h3>
        <InlineCommentForm
          resourceType="POST"
          resourceId={data.id}
          onSuccess={() => {
            toast.success("Comment posted!");
          }}
          isAlwaysOpen={true}
          user={user}
        />
        <div className="mt-10">
          <Suspense>
            <CommentPagInline resourceType="POST" resourceId={data?.id} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
