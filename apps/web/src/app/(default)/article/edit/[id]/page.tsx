import { EditArticlePage } from "@/components/pages/article/EditArticlePage";
import { requireAuth } from "@/features/auth/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Edit Article",
};

export default async function page() {
  const user = await requireAuth();

  return <EditArticlePage />;
}
