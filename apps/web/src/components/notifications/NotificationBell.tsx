"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useMarkNotificationsRead,
  useNotifications,
  useUnreadCount,
} from "@/features/notifications/hooks";
import { notificationHref } from "@/features/notifications/types";
import { useState } from "react";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { data: unread } = useUnreadCount(true);
  const { data, refetch, isFetching } = useNotifications(open, 10, 0);
  const markRead = useMarkNotificationsRead();

  const count = unread?.count ?? 0;
  const items = data?.items ?? [];

  return (
    <DropdownMenu
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) void refetch();
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative"
          aria-label={
            count > 0 ? `${count} unread notifications` : "Notifications"
          }
        >
          <Bell className="h-4 w-4" />
          {count > 0 && (
            <span className="absolute -top-1 -right-1 min-w-4 h-4 px-0.5 rounded-full bg-destructive text-destructive-foreground text-[10px] leading-4 text-center">
              {count > 99 ? "99+" : count}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {count > 0 && (
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={() => markRead.mutate({ all: true })}
            >
              Mark all read
            </button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isFetching && items.length === 0 ? (
          <div className="px-2 py-4 text-sm text-muted-foreground text-center">
            Loading…
          </div>
        ) : items.length === 0 ? (
          <div className="px-2 py-4 text-sm text-muted-foreground text-center">
            No notifications yet
          </div>
        ) : (
          items.map((n) => (
            <DropdownMenuItem
              key={n.id}
              className={`flex flex-col items-start gap-0.5 cursor-pointer ${
                !n.readAt ? "bg-muted/50" : ""
              }`}
              onClick={() => {
                if (!n.readAt) markRead.mutate({ ids: [n.id] });
                router.push(notificationHref(n));
              }}
            >
              <span className="text-sm leading-snug">
                {n.message ?? "New notification"}
              </span>
              <span className="text-xs text-muted-foreground">
                {new Date(n.createdAt).toLocaleString()}
              </span>
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/notifications" className="w-full justify-center">
            See all
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
