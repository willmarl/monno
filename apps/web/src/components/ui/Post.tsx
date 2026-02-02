import { Card } from "./card";
import { Avatar, AvatarImage, AvatarFallback } from "./avatar";
import { useRouter } from "next/navigation";
import { Button } from "./button";
import { Post as PostType } from "@/features/posts/types/post";
import { Trash, Heart, PencilLine, Eye } from "lucide-react";
import { ConfirmModal } from "../modal/ConfirmModal";
import { useModal } from "../modal/ModalProvider";
import { useDeletePost } from "@/features/posts/hooks";
import { toast } from "sonner";
import { useSessionUser } from "@/features/auth/hooks";
import { useToggleLike } from "@/features/likes/hooks";

export function Post({ data, isOwner }: { data: PostType; isOwner: boolean }) {
  const { data: user } = useSessionUser();
  const deletePost = useDeletePost();
  const { openModal, closeModal } = useModal();
  const router = useRouter();
  const like = useToggleLike();

  function handleLike() {
    like.mutate({ resourceType: "POST", resourceId: data.id });
  }

  function likeFeature() {
    if (data.likedByMe) {
      return (
        <div className="flex gap-1">
          {data.likeCount}
          <Heart
            fill="#FF0000"
            color="#FF0000"
            onClick={handleLike}
            className="cursor-pointer transition-transform hover:scale-110"
          />
        </div>
      );
    } else {
      return (
        <div className="flex gap-1">
          {data.likeCount}
          <Heart
            onClick={handleLike}
            className="cursor-pointer transition-transform hover:scale-110"
          />
        </div>
      );
    }
  }

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
        <div
          className="flex items-center gap-1 cursor-pointer"
          onClick={() => router.push(data?.creator.username)}
        >
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
        <div className="ml-auto flex gap-2 items-center">
          {isOwner && (
            <>
              <Button
                onClick={() => {
                  openModal({
                    title: "Delete Post",
                    content: (
                      <ConfirmModal
                        message={`Are you sure you want to delete this post?`}
                        onConfirm={() =>
                          deletePost.mutate(data.id, {
                            onSuccess: () => {
                              closeModal();
                              router.push(`/`);
                            },
                            onError: (error) => {
                              toast.error("Failed to delete post: " + error);
                            },
                          })
                        }
                        variant={"destructive"}
                      />
                    ),
                  });
                }}
              >
                <Trash />
              </Button>
              <Button
                onClick={() => router.push(`/post/edit/${data.id}`)}
                className="cursor-pointer"
              >
                <PencilLine />
              </Button>
            </>
          )}
          <div className="flex gap-1">
            {data.viewCount} <Eye />
          </div>
          {user && likeFeature()}
        </div>
      </div>
    </Card>
  );
}
