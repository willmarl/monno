import { Card } from "./card";
import { Avatar, AvatarImage, AvatarFallback } from "./avatar";
import { useRouter } from "next/navigation";
import { Button } from "./button";
import { Post as PostType } from "@/features/posts/types/post";
import { RESOURCE_TYPES } from "@/types/resource";
import { Trash, PencilLine, Eye, BookmarkPlus } from "lucide-react";
import { ConfirmModal } from "../modal/ConfirmModal";
import { useModal } from "../providers/ModalProvider";
import { useDeletePost } from "@/features/posts/hooks";
import { toast } from "sonner";
import { useSessionUser } from "@/features/auth/hooks";
import { useToggleLike } from "@/features/likes/hooks";
import { ModifyCollectionItemModal } from "../modal/ModifyCollectionItemModal";
import { LikeButton } from "../common/LikeButton";

export function Post({
  data,
  isOwner,
  truncateContent = true,
  truncateTitle = true,
}: {
  data: PostType;
  isOwner: boolean;
  truncateContent?: boolean;
  truncateTitle?: boolean;
}) {
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
        <div className="flex gap-1">
          <Button
            size="sm"
            className="cursor-pointer transition-transform hover:scale-110 h-8 w-8 p-0"
            variant="ghost"
            onClick={() => router.push(`/post/edit/${data.id}`)}
            title="Edit post"
          >
            <PencilLine className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            className="cursor-pointer transition-transform hover:scale-110 h-8 w-8 p-0"
            variant="ghost"
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
            title="Delete post"
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      );
    }
  }

  function bookmarkFeature(id: number) {
    if (!user) return "";
    return (
      <Button
        size="sm"
        variant="ghost"
        className="cursor-pointer h-8 w-8 p-0"
        onClick={() => {
          openModal({
            title: "Add post to collection",
            content: <ModifyCollectionItemModal postId={data.id} />,
          });
        }}
        title="Add to collection"
      >
        <BookmarkPlus className="h-4 w-4" />
      </Button>
    );
  }

  function handleLike() {
    like.mutate({ resourceType: RESOURCE_TYPES.POST, resourceId: data.id });
  }

  return (
    <Card className="p-3 md:p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start gap-2 pb-3 border-b border-border/50">
        <h2
          className={`cursor-pointer break-words text-sm md:text-base font-semibold hover:text-blue-500 transition-colors flex-1 overflow-wrap-break ${truncateTitle ? "line-clamp-2" : ""}`}
          style={{ wordBreak: "break-word", overflowWrap: "break-word" }}
          onClick={() => router.push(`/post/${data.id}`)}
        >
          {data?.title}
        </h2>
        {modifyPost(isOwner)}
      </div>
      <p
        className={`text-xs md:text-sm text-foreground my-3 break-words ${truncateContent ? "line-clamp-3" : ""}`}
        style={{ wordBreak: "break-word", overflowWrap: "break-word" }}
      >
        {data?.content}
      </p>
      <div className="flex items-center justify-between gap-2 mt-3 min-w-0">
        <div
          className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity min-w-0"
          onClick={() => router.push(data?.creator.username)}
        >
          <Avatar className="h-7 w-7 flex-shrink-0">
            <AvatarImage
              src={data?.creator.avatarPath}
              alt={data?.creator.username}
            />
            <AvatarFallback className="text-xs">
              {data?.creator.username?.[0]?.toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>
          <p className="text-xs md:text-sm font-medium text-muted-foreground truncate">
            {data?.creator.username}
          </p>
        </div>
        <div className="flex gap-2 items-center text-xs md:text-sm flex-shrink-0">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Eye className="h-4 w-4" />
            <span>{data.viewCount}</span>
          </div>
          <LikeButton
            isOwner={isOwner}
            likedByMe={data.likedByMe}
            likeCount={data.likeCount}
            onLike={handleLike}
          />
          {bookmarkFeature(data?.id)}
        </div>
      </div>
    </Card>
  );
}
