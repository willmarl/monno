"use client";

import { Button } from "@/components/ui/button";
import { AdminArticleSearchBar } from "@/features/admin/articles/components/AdminArticleSearchBar";
import { ArticleDataTable } from "./ArticleDataTable";
import { useModal } from "@/components/providers/ModalProvider";
import { AdminCreateArticleModal } from "@/features/admin/articles/components/modal/AdminCreateArticleModal";
import { AdminArticleSearchParams } from "@/types/search-params";

interface AdminArticlePageProps {
  searchParams?: AdminArticleSearchParams;
}

export function AdminArticlePage({ searchParams }: AdminArticlePageProps) {
  const { openModal } = useModal();

  return (
    <div className="container mx-auto py-10 flex flex-col gap-4">
      <div className="flex gap-2 mb-6">
        <AdminArticleSearchBar />
        <Button
          onClick={() => {
            openModal({
              title: "Create new article",
              content: <AdminCreateArticleModal />,
            });
          }}
        >
          Create Article
        </Button>
      </div>
      <ArticleDataTable searchParams={searchParams} />
    </div>
  );
}
