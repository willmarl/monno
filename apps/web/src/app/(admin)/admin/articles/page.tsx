import { AdminArticleSearchParams } from "@/types/search-params";
import { AdminArticlePage } from "@/components/pages/admin/articles/AdminArticlePage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Articles",
};

export default async function page({
  searchParams,
}: {
  searchParams: Promise<AdminArticleSearchParams>;
}) {
  const params = await searchParams;
  return <AdminArticlePage searchParams={params} />;
}
