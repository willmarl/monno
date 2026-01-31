import { AdminPostPage } from "@/components/pages/admin/posts/AdminPostPage";
import { AdminPostSearchParams } from "@/types/search-params";

export default async function page({
  searchParams,
}: {
  searchParams: Promise<AdminPostSearchParams>;
}) {
  const params = await searchParams;
  return <AdminPostPage searchParams={params} />;
}
