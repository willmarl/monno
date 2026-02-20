"use client";

import { ColumnDef, Column } from "@tanstack/react-table";
import { ArrowUpDown, Divide } from "lucide-react";
import { CreditPurchase } from "@/features/stripe/types/stripe";
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

export const columns: ColumnDef<CreditPurchase>[] = [
  {
    accessorKey: "id",
    header: ({ column }) => <SortableHeader column={column} label="ID" />,
  },
  {
    accessorKey: "amount",
    header: ({ column }) => <SortableHeader column={column} label="amount" />,
  },
  {
    accessorKey: "pricePaid",
    header: ({ column }) => (
      <SortableHeader column={column} label="Price paid" />
    ),
    cell: ({ row }) => {
      const price = Number(row.getValue("pricePaid"));
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(price / 100); // Divide by 100 if price is in cents

      return <div>{formatted}</div>;
    },
  },
  {
    accessorKey: "currency",
    header: ({ column }) => <SortableHeader column={column} label="Curreny" />,
  },
  {
    accessorKey: "purchasedAt",
    header: ({ column }) => <SortableHeader column={column} label="Date" />,
    cell: ({ row }) => {
      const date = String(row.getValue("purchasedAt"));
      const formatted = formatDate(date);

      return <div>{formatted}</div>;
    },
  },
];
