"use client";

import { useEffect } from "react";
import { PageLoadingState } from "@/components/common/PageLoadingState";
import { EditArticleForm } from "@/features/articles/components/EditArticleForm";
import { Card } from "@/components/ui/card";
import { useParams } from "next/navigation";
import { useSessionUser } from "@/features/auth/hooks";
import { useArticleById } from "@/features/articles/hooks";
import { useRouter } from "next/navigation";

export function EditArticlePage() {
  const { data: user, isLoading: loadingUser } = useSessionUser();
  const params = useParams<{ id: string }>();
  const { data: article, isLoading: loadingArticle } = useArticleById(
    Number(params.id),
  );
  const router = useRouter();

  useEffect(() => {
    if (!loadingArticle && !article) {
      router.push("/not-found");
    }
  }, [article, loadingArticle, router]);

  useEffect(() => {
    if (!loadingUser && !loadingArticle && article && user) {
      const isOwner = user.id === article.creator?.id;
      if (!isOwner) {
        router.push("/unauthorized");
      }
    }
  }, [user, loadingUser, article, loadingArticle, router]);

  if (loadingUser || loadingArticle) {
    return <PageLoadingState variant="card" />;
  }

  if (!article) {
    return null;
  }

  const isOwner = user?.id === article?.creator?.id;
  if (!isOwner) {
    return null;
  }

  return (
    <Card className="p-8 w-full max-w-md mx-auto">
      <EditArticleForm articleData={article} />
    </Card>
  );
}
