import { requireAuth } from "@/features/auth/server";
import { redirect } from "next/navigation";
import Layout from "@/components/layout/admin/Layout";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Admin Dashboard",
    template: "%s | Admin Dashboard",
  },
};
export default async function layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();

  if (user.role != "ADMIN") {
    redirect("/unauthorized");
  }

  return (
    <div className="p-4">
      <Layout>{children}</Layout>
    </div>
  );
}
