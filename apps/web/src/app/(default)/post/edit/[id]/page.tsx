import { EditPostPage } from "@/components/pages/post/EditPostPage";
import { requireAuth } from "@/features/auth/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Edit Post",
};

export default async function page() {
  await requireAuth();

  return <EditPostPage />;
}
