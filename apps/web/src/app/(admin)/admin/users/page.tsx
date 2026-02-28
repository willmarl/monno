import { AdminUserPage } from "@/components/pages/admin/users/AdminUserPage";
import { AdminUserSearchParams } from "@/types/search-params";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Users",
};
export default async function page({
  searchParams,
}: {
  searchParams: Promise<AdminUserSearchParams>;
}) {
  const params = await searchParams;
  return <AdminUserPage searchParams={params} />;
}
