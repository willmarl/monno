import { CreatePostPage } from "@/components/pages/post/CreatePostPage";
import { requireAuth } from "@/features/auth/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Post",
};

export default async function page() {
  await requireAuth();

  return <CreatePostPage />;
}
