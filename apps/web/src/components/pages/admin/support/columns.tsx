"use client";

import { ColumnDef, Column } from "@tanstack/react-table";
import { ArrowUpDown, Divide } from "lucide-react";
import { SupportTicket } from "@/features/support/types/support";
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
import { useModal } from "@/components/providers/ModalProvider";
import { TextPreviewCell } from "@/components/table/TextPreviewCell";
import { UpdateTicket } from "@/components/pages/admin/support/modal/UpdateTicket";

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

export const columns: ColumnDef<SupportTicket>[] = [
  {
    accessorKey: "id",
    header: ({ column }) => <SortableHeader column={column} label="ID" />,
  },
  {
    accessorKey: "title",
    header: ({ column }) => <SortableHeader column={column} label="Title" />,
  },
  {
    accessorKey: "message",
    header: ({ column }) => <SortableHeader column={column} label="Message" />,
    cell: ({ row }) => (
      <TextPreviewCell
        value={(row.getValue("message") as string) ?? ""}
        title="Message"
        maxLength={40}
      />
    ),
  },
  {
    accessorKey: "status",
    header: ({ column }) => <SortableHeader column={column} label="Status" />,
  },
  {
    accessorKey: "adminNotes",
    header: ({ column }) => <SortableHeader column={column} label="Notes" />,
    cell: ({ row }) => (
      <TextPreviewCell
        value={(row.getValue("adminNotes") as string) ?? ""}
        title="Admin Notes"
        maxLength={40}
      />
    ),
  },
  {
    accessorKey: "email",
    header: ({ column }) => <SortableHeader column={column} label="Email" />,
  },
  {
    accessorKey: "user",
    header: ({ column }) => <SortableHeader column={column} label="User" />,
    cell: ({ row }) => {
      const user = row.original.user;

      if (!user) {
        return <span className="text-muted-foreground">No user</span>;
      }

      const username: string | null = user.username;
      const avatarPath: string | null = user.avatarPath;

      return (
        <div className="flex gap-1 items-center">
          <Avatar className="h-8 w-8">
            {avatarPath && <AvatarImage src={avatarPath} alt={username} />}
            <AvatarFallback>{username?.[0]}</AvatarFallback>
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
      const ticket = row.original;
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
              onClick={() => {
                openModal({
                  title: "Edit data for " + row.original.title,
                  content: <UpdateTicket ticket={ticket} />,
                });
              }}
            >
              Edit support ticket
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
