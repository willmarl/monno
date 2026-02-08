import { Card } from "./card";
import { Avatar, AvatarImage, AvatarFallback } from "./avatar";
import { useRouter } from "next/navigation";
import { Button } from "./button";
import { Post as PostType } from "@/features/posts/types/post";
import { Trash, ThumbsUp, PencilLine, Eye, BookmarkPlus } from "lucide-react";
import { ConfirmModal } from "../modal/ConfirmModal";
import { useModal } from "../modal/ModalProvider";
import { useDeletePost } from "@/features/posts/hooks";
import { toast } from "sonner";
import { useSessionUser } from "@/features/auth/hooks";
import { useToggleLike } from "@/features/likes/hooks";
import { ModifyCollectionItemModal } from "../modal/ModifyCollectionItemModal";

export function Post({ data, isOwner }: { data: PostType; isOwner: boolean }) {
  const { data: user } = useSessionUser();
  const deletePost = useDeletePost();
  const { openModal, closeModal } = useModal();
  const router = useRouter();
  const like = useToggleLike();

  function modifyPost(isOwner: boolean) {
    if (!isOwner) {
      return;
    } else {
      return (
        <div className="flex gap-1.5">
          <Button
            className="cursor-pointer transition-transform hover:scale-110"
            variant="outline"
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
            className="cursor-pointer transition-transform hover:scale-110"
            variant="outline"
            onClick={() => router.push(`/post/edit/${data.id}`)}
          >
            <PencilLine />
          </Button>
        </div>
      );
    }
  }

  function bookmarkFeature(id: number) {
    if (!user) return "";
    return (
      <Button
        variant="ghost"
        className="cursor-pointer"
        onClick={() => {
          openModal({
            title: "Add post to collection",
            content: <ModifyCollectionItemModal postId={data.id} />,
          });
        }}
      >
        <BookmarkPlus />
      </Button>
    );
  }

  function handleLike() {
    like.mutate({ resourceType: "POST", resourceId: data.id });
  }

  function likeFeature() {
    if (data.likedByMe) {
      return (
        <div className="flex gap-1 items-center">
          <Button
            variant="ghost"
            // className="cursor-pointer"
            onClick={handleLike}
            className="cursor-pointer transition-transform hover:scale-110"
          >
            <ThumbsUp fill="#000000" color="#000000" />
          </Button>
          {data.likeCount}
        </div>
      );
    } else {
      return (
        <div className="flex gap-1 items-center">
          <Button
            variant="ghost"
            onClick={handleLike}
            className="cursor-pointer transition-transform hover:scale-110"
          >
            <ThumbsUp onClick={handleLike} />
          </Button>
          {data.likeCount}
        </div>
      );
    }
  }

  return (
    <Card className="p-4">
      <div className="flex justify-between">
        <h2
          className="cursor-pointer"
          onClick={() => router.push(`/post/${data.id}`)}
        >
          {data?.title}
        </h2>
        {modifyPost(isOwner)}
      </div>
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
          {bookmarkFeature(data?.id)}
          <div className="flex gap-1">
            <Eye /> {data.viewCount}
          </div>
          {user && likeFeature()}
        </div>
      </div>
    </Card>
  );
}
