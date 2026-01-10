"use client";

import { Post } from "@/components/ui/Post";
import { usePostById } from "@/features/posts/hooks";
import { useSessionUser } from "@/features/auth/hooks";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/card";

export default function page() {
  const params = useParams();
  const { data, isLoading, error } = usePostById(Number(params.id));
  const { data: user } = useSessionUser();
  const isOwner = data?.creator.id === user?.id;

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error || !data) {
    return (
      <Card className="flex justify-center items-center">
        Post does not exist
      </Card>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Post data={data} isOwner={isOwner} />
    </div>
  );
}
