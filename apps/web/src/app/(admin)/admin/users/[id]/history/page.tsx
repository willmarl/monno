import { AdminUserHistoryPage } from "@/components/pages/admin/users/AdminUserHistoryPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "User view history",
};

export default async function page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = Number(id);

  if (!Number.isFinite(userId) || userId < 1) {
    return <p className="text-muted-foreground">Invalid user id.</p>;
  }

  return <AdminUserHistoryPage userId={userId} />;
}
