import { AdminPostPage } from "@/components/pages/admin/posts/AdminPostPage";
import { AdminPostSearchParams } from "@/types/search-params";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Posts",
};
export default async function page({
  searchParams,
}: {
  searchParams: Promise<AdminPostSearchParams>;
}) {
  const params = await searchParams;
  return <AdminPostPage searchParams={params} />;
}
