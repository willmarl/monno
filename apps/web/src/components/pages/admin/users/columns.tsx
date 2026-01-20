"use client";

import { ColumnDef } from "@tanstack/react-table";
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
import { UserAdminEditModal } from "@/components/modal/UserAdminEdit";

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
    header: "ID",
  },
  {
    accessorKey: "username",
    header: () => <div>Username</div>,
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
    header: "Email",
  },
  {
    accessorKey: "isEmailVerified",
    header: "Verified",
  },
  {
    accessorKey: "role",
    header: "Role",
  },
  {
    accessorKey: "createdAt",
    header: () => <div>Created At</div>,
    cell: ({ row }) => {
      const date = String(row.getValue("createdAt"));
      const formatted = formatDate(date);

      return <div>{formatted}</div>;
    },
  },
  {
    accessorKey: "updatedAt",
    header: () => <div>Updated At</div>,
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
            <DropdownMenuItem>Edit user</DropdownMenuItem>
            <DropdownMenuItem>Delete user</DropdownMenuItem>
            <DropdownMenuItem>Change role</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
