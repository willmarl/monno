"use client";

import { ColumnDef, Column } from "@tanstack/react-table";
import { ArrowUpDown, Divide } from "lucide-react";
import { CreditTransaction } from "@/features/stripe/types/stripe";
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

export const columns: ColumnDef<CreditTransaction>[] = [
  {
    accessorKey: "id",
    header: ({ column }) => <SortableHeader column={column} label="ID" />,
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => <SortableHeader column={column} label="Date" />,
    cell: ({ row }) => {
      const date = String(row.getValue("createdAt"));
      const formatted = formatDate(date);

      return <div>{formatted}</div>;
    },
  },
  {
    accessorKey: "balanceBefore",
    header: ({ column }) => (
      <SortableHeader column={column} label="Bal. before" />
    ),
  },
  {
    accessorKey: "balanceAfter",
    header: ({ column }) => (
      <SortableHeader column={column} label="Bal. after" />
    ),
  },
  {
    accessorKey: "amount",
    header: ({ column }) => <SortableHeader column={column} label="Amount" />,
  },
  {
    accessorKey: "type",
    header: ({ column }) => <SortableHeader column={column} label="Type" />,
  },
];
