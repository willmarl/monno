import { AdminCommentPage } from "@/components/pages/admin/comments/AdminCommentPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Comments",
};
export default async function page({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    searchFields?: string;
    sort?: string;
    page?: string;
    limit?: string;
    caseSensitive?: string;
  }>;
}) {
  const params = await searchParams;
  return <AdminCommentPage searchParams={params} />;
}
