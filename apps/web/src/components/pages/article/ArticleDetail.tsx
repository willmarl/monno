"use client";

import { Article } from "@/components/ui/Article";
import { useArticleById } from "@/features/articles/hooks";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import { PageNotFound } from "@/components/common/PageNotFound";
import { PageLoadingState } from "@/components/common/PageLoadingState";
import { User } from "@/features/users/types/user";
import { useRecordView } from "@/features/views/hook";
// import { InlineNewCommentForm } from "@/features/comments/components/InlineNewCommentForm";
// import { CommentPagInline } from "@/components/pages/article/CommnetPagInline";
// import { Suspense } from "react";
// import { useSessionUser } from "@/features/auth/hooks";
// import { toast } from "sonner";

export function ArticleDetail({ user }: { user: User | undefined }) {
  const params = useParams();
  const articleId = Number(params.id);
  const { data, isLoading, error } = useArticleById(articleId);
  const { mutate: recordView } = useRecordView();
  const isOwner = data?.creator.id === user?.id;

  useEffect(() => {
    document.title = `${data?.title} | ${process.env.NEXT_PUBLIC_APP_NAME}`;
  }, [data?.title]);

  // Record view when article loads
  useEffect(() => {
    if (data?.id) {
      recordView({
        resourceType: "ARTICLE",
        resourceId: data.id,
      });
    }
  }, [data?.id, recordView]);

  if (isLoading) {
    return <PageLoadingState variant="card" />;
  }

  if (error || !data) {
    return <PageNotFound title="Article Not Found" />;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Article
        data={data}
        isOwner={isOwner}
        truncateTitle={false}
        truncateContent={false}
      />
      {/* <div className="bg-card rounded-lg p-4">
        <h3 className="font-semibold mb-4">Comments</h3>
        <InlineNewCommentForm
          resourceType="ARTICLE"
          resourceId={data.id}
          onSuccess={() => {
            toast.success("Comment articleed!");
          }}
          isAlwaysOpen={true}
          user={user}
        />
        <div className="mt-10">
          <Suspense>
            <CommentPagInline resourceType="ARTICLE" resourceId={data?.id} />
          </Suspense>
        </div>
      </div> */}
    </div>
  );
}
