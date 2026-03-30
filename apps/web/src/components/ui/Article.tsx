import { Card } from "./card";
import { Avatar, AvatarImage, AvatarFallback } from "./avatar";
import { useRouter } from "next/navigation";
import { Button } from "./button";
import { Article as ArticleType } from "@/features/articles/types/article";
import { Trash, PencilLine, Calendar } from "lucide-react";
import { ConfirmModal } from "../modal/ConfirmModal";
import { useModal } from "../providers/ModalProvider";
import { useDeleteArticle } from "@/features/articles/hooks";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  PUBLISHED: "bg-green-100 text-green-800",
  ARCHIVED: "bg-red-100 text-red-800",
  SCHEDULED: "bg-blue-100 text-blue-800",
};

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

  const statusColor = STATUS_COLORS[data.status] || "bg-gray-100 text-gray-800";
  const formattedDate = new Date(data.updatedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

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
            <span
              className={`inline-block px-2 py-1 rounded text-xs font-medium ${statusColor}`}
            >
              {data.status.charAt(0).toUpperCase() +
                data.status.slice(1).toLowerCase()}
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
        <div className="flex items-center gap-1 text-xs md:text-sm text-muted-foreground shrink-0">
          <Calendar className="h-4 w-4" />
          <span>{formattedDate}</span>
        </div>
      </div>
    </Card>
  );
}
