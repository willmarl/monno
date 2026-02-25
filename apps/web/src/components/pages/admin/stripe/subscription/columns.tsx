"use client";

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ColumnDef, Column } from "@tanstack/react-table";
import { ArrowUpDown, Divide } from "lucide-react";
import { Subscription } from "@/features/stripe/types/stripe";
import { Button } from "@/components/ui/button";

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

export const columns: ColumnDef<Subscription>[] = [
  {
    accessorKey: "id",
    header: ({ column }) => <SortableHeader column={column} label="ID" />,
  },
  {
    accessorKey: "user",
    header: ({ column }) => <SortableHeader column={column} label="Username" />,
    cell: ({ row }) => {
      const username: string = row.original.user.username;
      const avatarPath: string | null = row.original.user.avatarPath;

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
    accessorKey: "status",
    header: ({ column }) => <SortableHeader column={column} label="Status" />,
  },
  {
    accessorKey: "tier",
    header: ({ column }) => <SortableHeader column={column} label="Tier" />,
  },
  {
    accessorKey: "nextTier",
    header: ({ column }) => <SortableHeader column={column} label="nextTier" />,
  },
  {
    accessorKey: "periodStart",
    header: ({ column }) => (
      <SortableHeader column={column} label="Period start" />
    ),
    cell: ({ row }) => {
      const date = String(row.getValue("periodStart"));
      const formatted = formatDate(date);

      return <div>{formatted}</div>;
    },
  },
  {
    accessorKey: "periodEnd",
    header: ({ column }) => (
      <SortableHeader column={column} label="Period end" />
    ),
    cell: ({ row }) => {
      const date = String(row.getValue("periodEnd"));
      const formatted = formatDate(date);

      return <div>{formatted}</div>;
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <SortableHeader column={column} label="Created at" />
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
      <SortableHeader column={column} label="Updated at" />
    ),
    cell: ({ row }) => {
      const date = String(row.getValue("updatedAt"));
      const formatted = formatDate(date);

      return <div>{formatted}</div>;
    },
  },
];
