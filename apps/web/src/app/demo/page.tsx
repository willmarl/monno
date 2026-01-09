"use client";

import { usePostById } from "@/features/posts/hooks";

export default function page() {
  const { data, isLoading } = usePostById(100);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (data) {
    return (
      <div>
        {data?.id} {data?.content}
      </div>
    );
  }

  return <div>Post not found</div>;
}
