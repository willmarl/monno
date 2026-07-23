"use client";

import { ColumnDef, Column } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import { CreditPurchase } from "@/features/stripe/types/stripe";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useModal } from "@/components/providers/ModalProvider";
import { ConfirmModal } from "@/components/modal/ConfirmModal";
import { useAdminRefundCreditPurchase } from "@/features/stripe/hooks";
import { toast } from "sonner";

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
  const day = String(dateObj.getDate()).padStart(2, "0");
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");

  return `${year}-${day}-${month}`;
}

export const columns: ColumnDef<CreditPurchase>[] = [
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
      }).format(price / 100);

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
      return <div>{formatDate(date)}</div>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const purchase = row.original;
      const { openModal, closeModal } = useModal();
      const refund = useAdminRefundCreditPurchase();

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
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => {
                openModal({
                  title: "Refund credit purchase?",
                  content: (
                    <ConfirmModal
                      message={`This creates a full Stripe refund and removes ${purchase.amount} credits from ${purchase.user.username}. Aborts if their balance is too low.`}
                      variant="destructive"
                      buttonMessage="Refund"
                      showCancelButton
                      onCancel={closeModal}
                      onConfirm={async () => {
                        try {
                          await refund.mutateAsync(purchase.id);
                          toast.success("Refund queued in Stripe");
                          closeModal();
                        } catch (e: any) {
                          toast.error(e?.message || "Refund failed");
                        }
                      }}
                    />
                  ),
                });
              }}
            >
              Refund
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
