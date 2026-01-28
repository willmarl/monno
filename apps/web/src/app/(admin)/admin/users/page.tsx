import { AdminUserPage } from "@/components/pages/admin/users/AdminUserPage";

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
  return <AdminUserPage searchParams={params} />;
}
