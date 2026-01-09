"use client";

import { Card } from "./card";
import { Avatar, AvatarImage, AvatarFallback } from "./avatar";
import { usePostById } from "@/features/posts/hooks";

export function Post({ id }: { id: number }) {
  const { data, isLoading, error } = usePostById(id);

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
    <Card className="p-4">
      <h2>{data?.title}</h2>
      <p className="text-sm text-foreground">{data?.content}</p>
      <div className="flex gap-3 items-center">
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage
            src={data?.creator.avatarPath}
            alt={data?.creator.username}
          />
          <AvatarFallback>
            {data?.creator.username?.[0]?.toUpperCase() || "?"}
          </AvatarFallback>
        </Avatar>
        <p className="text-sm font-medium text-muted-foreground">
          {data?.creator.username}
        </p>
      </div>
    </Card>
  );
}
