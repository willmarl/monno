"use client";

import { ColumnDef, Column } from "@tanstack/react-table";
import { ArrowUpDown, Divide } from "lucide-react";
import { User } from "@/features/users/types/user";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { MoreHorizontal } from "lucide-react";
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
import { useModal } from "@/components/modal/ModalProvider";
import { ConfirmModal } from "@/components/modal/ConfirmModal";
import { EditUser } from "@/components/pages/admin/users/modal/EditUser";
import { DeleteUser } from "./modal/DeleteUser";

interface SortableHeaderProps {
  column: Column<any, unknown>;
  label: string;
}

function SortableHeader({ column, label }: SortableHeaderProps) {
  return (
    <Button
      className="cursor-pointer"
      variant="ghost"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    >
      {label}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  );
}

function formatDate(dateString: string): string {
  const dateObj = new Date(dateString);

  const year = dateObj.getFullYear();
  const day = String(dateObj.getDate()).padStart(2, "0"); // Pad with '0' if needed
  const month = String(dateObj.getMonth() + 1).padStart(2, "0"); // Month is 0-indexed (0=Jan)

  const formattedDate = `${year}-${day}-${month}`;
  return formattedDate;
}

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
    accessorKey: "status",
    header: ({ column }) => <SortableHeader column={column} label="Status" />,
  },
  {
    accessorKey: "statusReason",
    header: ({ column }) => <SortableHeader column={column} label="Reason" />,
    cell: ({ row }) => {
      const { openModal } = useModal();
      const reason = (row.getValue("statusReason") as string) ?? "";
      const truncated =
        reason.length > 30 ? reason.slice(0, 27) + "..." : reason;

      return (
        <div
          onClick={() => {
            openModal({
              title: "Status Reason",
              content: (
                <ConfirmModal
                  message={reason}
                  showButton={false}
                  onConfirm={() => null}
                />
              ),
            });
          }}
          className="max-w-40 truncate text-sm cursor-pointer"
          title={reason || undefined}
        >
          {truncated || "—"}
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

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => router.push("/user/" + user.username)}
            >
              View profile
            </DropdownMenuItem>
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
              // ===== Using custom component =====
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
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
