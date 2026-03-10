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
import { Collection } from "@/features/collections/types/collection";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  useAdminUpdateCollection,
  useAdminDeleteCollection,
  useAdminRestoreCollection,
} from "@/features/collections/hooks";
import { useRouter } from "next/navigation";
import { SortableHeader } from "@/components/table/SortableHeader";
import { TextPreviewCell } from "@/components/table/TextPreviewCell";
import { formatDate } from "@/lib/utils/date";
import { UpdateCollection } from "./modal/UpdateCollection";
import { useModal } from "@/components/providers/ModalProvider";
import { toast } from "sonner";

export const columns: ColumnDef<Collection>[] = [
  {
    accessorKey: "id",
    header: ({ column }) => <SortableHeader column={column} label="ID" />,
  },
  {
    accessorKey: "name",
    header: ({ column }) => <SortableHeader column={column} label="Name" />,
    cell: ({ row }) => (
      <TextPreviewCell
        value={(row.getValue("name") as string) ?? ""}
        title="Collection Name"
        maxLength={40}
      />
    ),
  },
  {
    accessorKey: "description",
    header: ({ column }) => (
      <SortableHeader column={column} label="Description" />
    ),
    cell: ({ row }) => (
      <TextPreviewCell
        value={(row.getValue("description") as string) ?? ""}
        title="Collection Description"
        maxLength={40}
      />
    ),
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
    accessorKey: "deleted",
    header: ({ column }) => <SortableHeader column={column} label="Status" />,
    cell: ({ row }) => {
      const collection = row.original;
      if (collection.deleted) {
        const date = String(collection.deletedAt);
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
      const router = useRouter();
      const collection = row.original;
      const restoreCollection = useAdminRestoreCollection();
      const deleteCollection = useAdminDeleteCollection();
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
            {!collection.deleted ? (
              <DropdownMenuItem
                variant="default"
                onClick={() => {
                  router.push(`/collection/${collection.id}`);
                }}
              >
                View collection
              </DropdownMenuItem>
            ) : (
              ""
            )}
            <DropdownMenuItem
              onClick={() => {
                openModal({
                  title: "Update collection " + row.original.name,
                  content: <UpdateCollection collection={row.original} />,
                });
              }}
            >
              Update collection
            </DropdownMenuItem>

            {collection.deleted ? (
              <DropdownMenuItem
                onClick={() => {
                  restoreCollection.mutate(collection.id, {
                    onSuccess: () => {
                      toast.success(
                        `Successfully restored collection ${collection.name}`,
                      );
                    },
                    onError: (err) => {
                      toast.error(
                        `Failed to restore collection ${collection.name}`,
                      );
                    },
                  });
                }}
              >
                Restore collection
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                variant="destructive"
                onClick={() => {
                  deleteCollection.mutate(collection.id, {
                    onSuccess: () => {
                      toast.success(
                        `Successfully deleted collection ${collection.name}`,
                      );
                    },
                    onError: (err) => {
                      toast.error(
                        `Failed to delete collection ${collection.name}`,
                      );
                    },
                  });
                }}
              >
                Delete collection
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
