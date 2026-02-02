"use client";

import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ColumnDef } from "@tanstack/react-table";
import { Post } from "@/features/posts/types/post";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  useAdminDeletePost,
  useAdminRestorePost,
} from "@/features/posts/hooks";
import { useRouter } from "next/navigation";
import { useModal } from "@/components/modal/ModalProvider";
import { ConfirmModal } from "@/components/modal/ConfirmModal";
import { SortableHeader } from "@/components/table/SortableHeader";
import { formatDate } from "@/lib/utils/date";

export const columns: ColumnDef<Post>[] = [
  {
    accessorKey: "id",
    header: ({ column }) => <SortableHeader column={column} label="ID" />,
  },
  {
    accessorKey: "title",
    header: ({ column }) => <SortableHeader column={column} label="Title" />,
    cell: ({ row }) => {
      const { openModal } = useModal();
      const title = (row.getValue("title") as string) ?? "";
      const truncated = title.length > 30 ? title.slice(0, 27) + "..." : title;

      return (
        <div
          onClick={() => {
            openModal({
              title: "Title",
              content: (
                <ConfirmModal
                  message={title}
                  showButton={false}
                  onConfirm={() => null}
                />
              ),
            });
          }}
          className="max-w-40 truncate text-sm cursor-pointer"
          title={title || undefined}
        >
          {truncated || "—"}
        </div>
      );
    },
  },
  {
    accessorKey: "content",
    header: ({ column }) => <SortableHeader column={column} label="Content" />,
    cell: ({ row }) => {
      const { openModal } = useModal();
      const content = (row.getValue("content") as string) ?? "";
      const truncated =
        content.length > 30 ? content.slice(0, 27) + "..." : content;

      return (
        <div
          onClick={() => {
            openModal({
              title: "content",
              content: (
                <ConfirmModal
                  message={content}
                  showButton={false}
                  onConfirm={() => null}
                />
              ),
            });
          }}
          className="max-w-40 truncate text-sm cursor-pointer"
          title={content || undefined}
        >
          {truncated || "—"}
        </div>
      );
    },
  },
  {
    accessorKey: "likeCount",
    header: ({ column }) => <SortableHeader column={column} label="Likes" />,
  },
  //   views here
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
    accessorKey: "deleted",
    header: ({ column }) => <SortableHeader column={column} label="Status" />,
    cell: ({ row }) => {
      const post = row.original;
      if (post.deleted) {
        const date = String(post.deletedAt);
        const formatted = formatDate(date);

        return <div>Deleted at {formatted}</div>;
      } else {
        return <div>Active</div>;
      }
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const post = row.original;
      const router = useRouter();
      const restorePost = useAdminRestorePost();
      const deletePost = useAdminDeletePost();

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

            {post.deleted ? (
              <DropdownMenuItem
                onClick={() => {
                  restorePost.mutate(post.id);
                }}
              >
                Restore post
              </DropdownMenuItem>
            ) : (
              <div>
                <DropdownMenuItem
                  onClick={() => {
                    router.push(`/post/${post.id}`);
                  }}
                >
                  View post
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => {
                    deletePost.mutate(post.id);
                  }}
                >
                  Delete post
                </DropdownMenuItem>
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
