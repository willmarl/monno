import { AdminArticleSearchBar } from "@/features/admin/articles/components/AdminArticleSearchBar";
import { ArticleDataTable } from "./ArticleDataTable";
import { AdminArticleSearchParams } from "@/types/search-params";

interface AdminArticlePageProps {
  searchParams?: AdminArticleSearchParams;
}

export function AdminArticlePage({ searchParams }: AdminArticlePageProps) {
  return (
    <div className="container mx-auto py-10 flex flex-col gap-4">
      <AdminArticleSearchBar />
      <ArticleDataTable searchParams={searchParams} />
    </div>
  );
}
