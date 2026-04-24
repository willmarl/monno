"use client";

import { MoreHorizontal, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ColumnDef } from "@tanstack/react-table";
import { Article } from "@/features/admin/articles/types/article";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { MediaGallery } from "@/components/ui/MediaGallery";
import {
  useAdminDeleteArticle,
  useAdminRestoreArticle,
} from "@/features/admin/articles/hooks";
import { useRouter } from "next/navigation";
import { SortableHeader } from "@/components/table/SortableHeader";
import { TextPreviewCell } from "@/components/table/TextPreviewCell";
import { formatDate } from "@/lib/utils/date";
import { AdminEditArticleModal } from "@/features/admin/articles/components/modal/AdminEditArticleModal";
import { useModal } from "@/components/providers/ModalProvider";

export const columns: ColumnDef<Article>[] = [
  {
    accessorKey: "id",
    header: ({ column }) => <SortableHeader column={column} label="ID" />,
    cell: ({ row }) => {
      const article = row.original;
      const id = String(row.getValue("id"));

      if (article.deleted) {
        const date = String(article.deletedAt);
        const formatted = formatDate(date);

        return (
          <div className="flex items-center gap-2">
            <span>{id}</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <Trash2 className="h-4 w-4 text-muted-foreground opacity-60 cursor-help" />
              </TooltipTrigger>
              <TooltipContent>Deleted at {formatted}</TooltipContent>
            </Tooltip>
          </div>
        );
      }

      return <div>{id}</div>;
    },
  },
  {
    accessorKey: "title",
    header: ({ column }) => <SortableHeader column={column} label="Title" />,
    cell: ({ row }) => (
      <TextPreviewCell
        value={(row.getValue("title") as string) ?? ""}
        title="Title"
      />
    ),
  },
  {
    accessorKey: "media",
    header: "Image",
    cell: ({ row }) => {
      const article = row.original;
      if (!article.media.length) {
        return <div className="text-xs text-muted-foreground">No image</div>;
      }
      const sorted = [...article.media].sort((a, b) => a.sortOrder - b.sortOrder);
      return (
        <div className="relative inline-block">
          <MediaGallery
            images={sorted.map((m) => ({ src: m.thumbnail ?? m.original, alt: article.title }))}
            className="h-16 w-16 rounded"
          />
          {sorted.length > 1 && (
            <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] font-semibold leading-none px-1.5 py-0.5 rounded-full pointer-events-none">
              {sorted.length}
            </span>
          )}
        </div>
      );
    },
  },
  // EoF Omit
  {
    accessorKey: "content",
    header: ({ column }) => <SortableHeader column={column} label="Content" />,
    cell: ({ row }) => (
      <TextPreviewCell
        value={(row.getValue("content") as string) ?? ""}
        title="Content"
      />
    ),
  },
  {
    accessorKey: "status",
    header: ({ column }) => <SortableHeader column={column} label="Status" />,
  },
  {
    accessorKey: "viewCount",
    header: ({ column }) => <SortableHeader column={column} label="Views" />,
  },
  {
    accessorKey: "likeCount",
    header: ({ column }) => <SortableHeader column={column} label="Likes" />,
  },
  {
    accessorKey: "creator.username",
    header: ({ column }) => <SortableHeader column={column} label="Username" />,
    cell: ({ row }) => {
      const username: string = row.original.creator.username;
      const avatarPath: string | null = row.original.creator.avatarPath;

      return (
        <div className="flex gap-1 items-center">
          <Avatar className="h-8 w-8">
            {avatarPath && <AvatarImage src={avatarPath} alt={username} />}
            <AvatarFallback>{username[0]}</AvatarFallback>
          </Avatar>
          <p>{username}</p>
        </div>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <SortableHeader column={column} label="Created At" />
    ),
    cell: ({ row }) => {
      const date = String(row.getValue("createdAt"));
      const formatted = formatDate(date);

      return <div>{formatted}</div>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const article = row.original;
      const router = useRouter();
      const restoreArticle = useAdminRestoreArticle();
      const deleteArticle = useAdminDeleteArticle();
      const { openModal } = useModal();

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>

            {article.deleted ? (
              <div>
                <DropdownMenuItem
                  onClick={() => {
                    openModal({
                      title: "Edit data for " + row.original.title,
                      content: <AdminEditArticleModal data={row.original} />,
                    });
                  }}
                >
                  Edit article
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    restoreArticle.mutate(article.id);
                  }}
                >
                  Restore article
                </DropdownMenuItem>
              </div>
            ) : (
              <div>
                <DropdownMenuItem
                  onClick={() => {
                    router.push(`/article/${article.id}`);
                  }}
                >
                  View article
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    openModal({
                      title: "Edit data for " + row.original.title,
                      content: <AdminEditArticleModal data={row.original} />,
                    });
                  }}
                >
                  Edit article
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => {
                    deleteArticle.mutate(article.id);
                  }}
                >
                  Delete article
                </DropdownMenuItem>
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
