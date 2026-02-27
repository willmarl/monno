import { AdminCommentSearchBar } from "@/features/admin/comments/components/AdminCommentSearchBar";
import { AdminCommentSearchParams } from "@/types/search-params";
import { CommentDataTable } from "./CommentDataTable";

interface AdminCommentPageProps {
  searchParams?: AdminCommentSearchParams;
}

export function AdminCommentPage({ searchParams }: AdminCommentPageProps) {
  return (
    <div className="container mx-auto py-10 flex flex-col gap-4">
      <AdminCommentSearchBar basePath="/admin/comments" />
      <CommentDataTable />
    </div>
  );
}
