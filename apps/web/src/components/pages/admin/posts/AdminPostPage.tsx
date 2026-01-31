import { AdminPostSearchBar } from "@/features/admin/posts/components/AdminPostSearchBar";
import { PostDataTable } from "./PostDataTable";
import { AdminPostSearchParams } from "@/types/search-params";

interface AdminPostPageProps {
  searchParams?: AdminPostSearchParams;
}

export function AdminPostPage({ searchParams }: AdminPostPageProps) {
  return (
    <div>
      <p>admin post page here</p>
      <AdminPostSearchBar basePath="/admin/posts" />
      <PostDataTable />
    </div>
  );
}
