"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import { User } from "@/features/users/types/user";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useModal } from "@/components/providers/ModalProvider";
import { EditUser } from "@/components/pages/admin/users/modal/EditUser";
import { DeleteUser } from "./modal/DeleteUser";
import { SortableHeader } from "@/components/table/SortableHeader";
import { TextPreviewCell } from "@/components/table/TextPreviewCell";
import { formatDate } from "@/lib/utils/date";
import { UsernameHistoryList } from "@/features/admin/users/components/UsernameHistoryList";
import { useAdminRestoreUser } from "@/features/users/hooks";
import { toast } from "sonner";

export const columns: ColumnDef<User>[] = [
  {
    accessorKey: "id",
    header: ({ column }) => <SortableHeader column={column} label="ID" />,
  },
  {
    accessorKey: "username",
    header: ({ column }) => <SortableHeader column={column} label="Username" />,
    cell: ({ row }) => {
      const username: string = row.getValue("username");
      const avatarPath: string | null = row.original.avatarPath;

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
    accessorKey: "email",
    header: ({ column }) => <SortableHeader column={column} label="Email" />,
  },
  {
    accessorKey: "isEmailVerified",
    header: ({ column }) => <SortableHeader column={column} label="Verified" />,
  },
  {
    accessorKey: "role",
    header: ({ column }) => <SortableHeader column={column} label="Role" />,
  },
  {
    accessorKey: "credits",
    header: ({ column }) => <SortableHeader column={column} label="Credits" />,
  },
  {
    accessorKey: "subscription.status",
    header: ({ column }) => (
      <SortableHeader column={column} label="Sub. status" />
    ),
    cell: ({ row }) => {
      const status = row.original.subscription?.status;
      return <div>{status ?? "-"}</div>;
    },
  },
  {
    accessorKey: "subscription.tier",
    header: ({ column }) => (
      <SortableHeader column={column} label="Sub. tier" />
    ),
    cell: ({ row }) => {
      const tier = row.original.subscription?.tier;
      return <div>{tier ?? "-"}</div>;
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => <SortableHeader column={column} label="Status" />,
  },
  {
    accessorKey: "statusReason",
    header: ({ column }) => <SortableHeader column={column} label="Reason" />,
    cell: ({ row }) => (
      <TextPreviewCell
        value={(row.getValue("statusReason") as string) ?? ""}
        title="Status Reason"
      />
    ),
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
    accessorKey: "updatedAt",
    header: ({ column }) => (
      <SortableHeader column={column} label="Updated At" />
    ),
    cell: ({ row }) => {
      const date = String(row.getValue("updatedAt"));
      const formatted = formatDate(date);

      return <div>{formatted}</div>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const user = row.original;
      const router = useRouter();
      const { openModal } = useModal();
      const restoreUser = useAdminRestoreUser();

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {!user.deleted ? (
              <DropdownMenuItem
                onClick={() => router.push("/user/" + user.username)}
              >
                View profile
              </DropdownMenuItem>
            ) : (
              ""
            )}
            <DropdownMenuItem
              onClick={() => {
                openModal({
                  title: "Edit data for " + row.original.username,
                  content: <EditUser user={row.original} />,
                });
              }}
            >
              Edit user
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                openModal({
                  title: `Username history for ${row.original.username}`,
                  content: <UsernameHistoryList userId={row.original.id} />,
                });
              }}
            >
              View username history
            </DropdownMenuItem>
            {!user.deleted ? (
              <DropdownMenuItem
                variant="destructive"
                onClick={() => {
                  openModal({
                    title: "Delete user",
                    content: <DeleteUser user={user} />,
                  });
                }}
              >
                Delete user
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                variant="default"
                onClick={() => {
                  restoreUser.mutate(user.id, {
                    onSuccess: () => {
                      toast.success(
                        `Successfully restored user ${user.username}`,
                      );
                    },
                    onError: (err) => {
                      toast.error(`Failed to restore user ${user.username}`);
                    },
                  });
                }}
              >
                Restore user
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
