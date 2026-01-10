"use client";

import { Card } from "./card";
import { Avatar, AvatarImage, AvatarFallback } from "./avatar";
import { usePostById } from "@/features/posts/hooks";
import { useRouter } from "next/navigation";
import { useSessionUser } from "@/features/auth/hooks";
import { Button } from "./button";

export function Post({ id }: { id: number }) {
  const { data: user } = useSessionUser();
  const { data, isLoading, error } = usePostById(id);
  const router = useRouter();

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

  const isOwner = data.creator.id === user?.id;

  return (
    <Card className="p-4">
      <h2 className="cursor-pointer" onClick={() => router.push(`/post/${id}`)}>
        {data?.title}
      </h2>
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

        {isOwner ? (
          <Button
            onClick={() => router.push(`/post/edit/${id}`)}
            className="cursor-pointer ml-auto"
          >
            Edit Post
          </Button>
        ) : (
          ""
        )}
      </div>
    </Card>
  );
}
