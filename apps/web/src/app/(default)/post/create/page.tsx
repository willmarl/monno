import NewPostForm from "@/features/posts/components/NewPostForm";
import { Card } from "@/components/ui/card";
import { requireAuth } from "@/features/auth/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Post",
};

export default async function page() {
  const user = await requireAuth();

  return (
    <Card className="p-8 w-full max-w-md mx-auto">
      <NewPostForm />
    </Card>
  );
}
