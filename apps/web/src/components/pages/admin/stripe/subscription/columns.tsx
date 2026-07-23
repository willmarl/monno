"use client";

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ColumnDef, Column } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import { Subscription } from "@/features/stripe/types/stripe";
import { Button } from "@/components/ui/button";
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
import { useAdminCancelSubscription } from "@/features/stripe/hooks";
import { SubscriptionInvoicesPanel } from "@/features/admin/stripe/components/SubscriptionInvoicesPanel";
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
      return <div>{formatDate(date)}</div>;
    },
  },
  {
    accessorKey: "periodEnd",
    header: ({ column }) => (
      <SortableHeader column={column} label="Period end" />
    ),
    cell: ({ row }) => {
      const date = String(row.getValue("periodEnd"));
      return <div>{formatDate(date)}</div>;
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <SortableHeader column={column} label="Created at" />
    ),
    cell: ({ row }) => {
      const date = String(row.getValue("createdAt"));
      return <div>{formatDate(date)}</div>;
    },
  },
  {
    accessorKey: "updatedAt",
    header: ({ column }) => (
      <SortableHeader column={column} label="Updated at" />
    ),
    cell: ({ row }) => {
      const date = String(row.getValue("updatedAt"));
      return <div>{formatDate(date)}</div>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const sub = row.original;
      const { openModal, closeModal } = useModal();
      const cancel = useAdminCancelSubscription();
      const alreadyCanceled = sub.status === "CANCELED" && sub.tier === "FREE";
      const cancelScheduled = sub.nextTier === "FREE";

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
              onClick={() => {
                openModal({
                  title: `Invoices — ${sub.user.username}`,
                  content: (
                    <SubscriptionInvoicesPanel subscriptionId={sub.id} />
                  ),
                });
              }}
            >
              View invoices
            </DropdownMenuItem>
            {!alreadyCanceled && !cancelScheduled && (
              <DropdownMenuItem
                onClick={() => {
                  openModal({
                    title: "Cancel at period end?",
                    content: (
                      <ConfirmModal
                        message={`${sub.user.username} keeps ${sub.tier} until period end, then drops to FREE.`}
                        variant="destructive"
                        buttonMessage="Schedule cancel"
                        showCancelButton
                        onCancel={closeModal}
                        onConfirm={async () => {
                          try {
                            await cancel.mutateAsync({
                              id: sub.id,
                              mode: "period_end",
                            });
                            toast.success("Cancel scheduled at period end");
                            closeModal();
                          } catch (e: any) {
                            toast.error(e?.message || "Cancel failed");
                          }
                        }}
                      />
                    ),
                  });
                }}
              >
                Cancel at period end
              </DropdownMenuItem>
            )}
            {!alreadyCanceled && (
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => {
                  openModal({
                    title: "Cancel immediately?",
                    content: (
                      <ConfirmModal
                        message={`Immediately cancel ${sub.user.username}'s subscription and set tier to FREE.`}
                        variant="destructive"
                        buttonMessage="Cancel now"
                        showCancelButton
                        onCancel={closeModal}
                        onConfirm={async () => {
                          try {
                            await cancel.mutateAsync({
                              id: sub.id,
                              mode: "immediate",
                            });
                            toast.success("Subscription canceled");
                            closeModal();
                          } catch (e: any) {
                            toast.error(e?.message || "Cancel failed");
                          }
                        }}
                      />
                    ),
                  });
                }}
              >
                Cancel immediately
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
