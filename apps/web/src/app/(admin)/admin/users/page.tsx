import { AdminUserPage } from "@/components/pages/admin/users/AdminUserPage";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function page({ searchParams }: PageProps) {
  const params = await searchParams;
  return <AdminUserPage searchParams={params} />;
}
