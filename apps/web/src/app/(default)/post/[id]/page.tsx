"use client";

import { Post } from "@/components/ui/Post";
import { usePostById } from "@/features/posts/hooks";
import { useSessionUser } from "@/features/auth/hooks";
import { useRecordView } from "@/features/views/hook";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { useEffect } from "react";

export default function page() {
  const params = useParams();
  const postId = Number(params.id);
  const { data, isLoading, error } = usePostById(postId);
  const { data: user } = useSessionUser();
  const { mutate: recordView } = useRecordView();
  const isOwner = data?.creator.id === user?.id;

  // Record view when post loads
  useEffect(() => {
    if (data?.id) {
      recordView({
        resourceType: "POST",
        resourceId: data.id,
      });
    }
  }, [data?.id, recordView]);

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
