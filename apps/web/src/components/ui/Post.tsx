import { Card } from "./card";
import { Avatar, AvatarImage, AvatarFallback } from "./avatar";
import { useRouter } from "next/navigation";
import { Button } from "./button";
import { Post as PostType } from "@/features/posts/types/post";

export function Post({ data, isOwner }: { data: PostType; isOwner: boolean }) {
  const router = useRouter();

  return (
    <Card className="p-4">
      <h2
        className="cursor-pointer"
        onClick={() => router.push(`/post/${data.id}`)}
      >
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
            onClick={() => router.push(`/post/edit/${data.id}`)}
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
