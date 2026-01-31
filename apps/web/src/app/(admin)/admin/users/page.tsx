import { AdminUserPage } from "@/components/pages/admin/users/AdminUserPage";
import { AdminUserSearchParams } from "@/types/search-params";

export default async function page({
  searchParams,
}: {
  searchParams: Promise<AdminUserSearchParams>;
}) {
  const params = await searchParams;
  return <AdminUserPage searchParams={params} />;
}
