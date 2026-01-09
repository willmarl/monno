import UpdatePostForm from "@/features/posts/components/UpdatePostForm";
import { Card } from "@/components/ui/card";
import { requireAuth } from "@/features/auth/server";

export default async function Page({
  params,
}: {
  params: Promise<{ id: number }>;
}) {
  const user = await requireAuth();

  const { id } = await params;

  return (
    <Card className="p-8 w-full max-w-md mx-auto">
      <UpdatePostForm postId={id} />
    </Card>
  );
}
