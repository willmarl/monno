import { Card } from "./card";
import { Avatar, AvatarImage, AvatarFallback } from "./avatar";
import { useRouter } from "next/navigation";
import { Button } from "./button";
import { Article as ArticleType } from "@/features/articles/types/article";
import { Trash, PencilLine, Calendar, Eye } from "lucide-react";
import { ConfirmModal } from "../modal/ConfirmModal";
import { useModal } from "../providers/ModalProvider";
import { useDeleteArticle } from "@/features/articles/hooks";
import { toast } from "sonner";
import { InlineEditArticleForm } from "@/features/articles/components/InlineEditArticleForm";
import { LikeButton } from "../common/LikeButton";
import { useToggleLike } from "@/features/likes/hooks";
import { RESOURCE_TYPES } from "@/types/resource";
import { CollectionButton } from "../common/CollectionButton";

export function Article({
  data,
  isOwner,
  truncateContent = true,
  truncateTitle = true,
}: {
  data: ArticleType;
  isOwner: boolean;
  truncateContent?: boolean;
  truncateTitle?: boolean;
}) {
  const deleteArticle = useDeleteArticle();
  const { openModal, closeModal } = useModal();
  const router = useRouter();
  const like = useToggleLike();

  function modifyArticle(isOwner: boolean) {
    if (!isOwner) {
      return;
    } else {
      return (
        <div className="flex gap-1">
          <Button
            size="sm"
            className="cursor-pointer transition-transform hover:scale-110 h-8 w-8 p-0"
            variant="ghost"
            onClick={() => router.push(`/article/edit/${data.id}`)}
            title="Edit article"
          >
            <PencilLine className="h-4 w-4" />
          </Button>
          {/* edit inline button below me is for testing purposes, remove me after test */}
          <Button
            onClick={() => {
              openModal({
                title: "edit Article",
                content: <InlineEditArticleForm articleData={data} />,
              });
            }}
            title="edit article"
          >
            edit inline
          </Button>
          {/* EoF test */}
          <Button
            size="sm"
            className="cursor-pointer transition-transform hover:scale-110 h-8 w-8 p-0"
            variant="ghost"
            onClick={() => {
              openModal({
                title: "Delete Article",
                content: (
                  <ConfirmModal
                    message={`Are you sure you want to delete this article?`}
                    onConfirm={() =>
                      deleteArticle.mutate(data.id, {
                        onSuccess: () => {
                          closeModal();
                          router.push(`/article`);
                        },
                        onError: (error) => {
                          toast.error("Failed to delete article: " + error);
                        },
                      })
                    }
                    variant={"destructive"}
                  />
                ),
              });
            }}
            title="Delete article"
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      );
    }
  }

  const formattedDate = new Date(data.updatedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  function handleLike() {
    like.mutate({ resourceType: RESOURCE_TYPES.ARTICLE, resourceId: data.id });
  }

  return (
    <Card className="p-3 md:p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start gap-2 pb-3 border-b border-border/50">
        <div className="flex-1">
          <h2
            className={`cursor-pointer text-sm md:text-base font-semibold hover:text-blue-500 transition-colors ${truncateTitle ? "line-clamp-2" : ""}`}
            style={{ wordBreak: "break-word", overflowWrap: "break-word" }}
            onClick={() => router.push(`/article/${data.id}`)}
          >
            {data?.title}
          </h2>
          <div className="mt-2">
            <span className="text-xs text-muted-foreground">
              {data.status
                ? data.status.charAt(0).toUpperCase() +
                  data.status.slice(1).toLowerCase()
                : "Draft"}
            </span>
          </div>
        </div>
        {modifyArticle(isOwner)}
      </div>
      <p
        className={`text-xs md:text-sm text-foreground my-3 ${truncateContent ? "line-clamp-3" : ""}`}
        style={{ wordBreak: "break-word", overflowWrap: "break-word" }}
      >
        {data?.content}
      </p>
      <div className="flex items-center justify-between gap-2 mt-3 min-w-0">
        <div
          className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity min-w-0"
          onClick={() => router.push("/user/" + data?.creator.username)}
        >
          <Avatar className="h-7 w-7 shrink-0">
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
          <CollectionButton
            resourceId={data.id}
            resourceType={RESOURCE_TYPES.ARTICLE}
          />
          <Calendar className="h-4 w-4" />
          <span>{formattedDate}</span>
        </div>
      </div>
    </Card>
  );
}
