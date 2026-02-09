import { AdminCommentSearchBar } from "@/features/admin/comments/components/AdminCommentSearchBar";
import { AdminCommentSearchParams } from "@/types/search-params";
import { CommentDataTable } from "./CommentDataTable";

interface AdminCommentPageProps {
  searchParams?: AdminCommentSearchParams;
}

export function AdminCommentPage({ searchParams }: AdminCommentPageProps) {
  return (
    <div>
      <p>admin comment page here</p>
      <AdminCommentSearchBar basePath="/admin/comments" />
      <CommentDataTable />
    </div>
  );
}
