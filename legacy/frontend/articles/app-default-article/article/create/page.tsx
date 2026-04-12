import { CreateArticlePage } from "@/components/pages/article/CreateArticlePage";
import { requireAuth } from "@/features/auth/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Article",
};

export default async function page() {
  const user = await requireAuth();

  return <CreateArticlePage />;
}
