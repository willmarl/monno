"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  useMarkNotificationsRead,
  useNotifications,
  useUnreadCount,
} from "@/features/notifications/hooks";
import { notificationHref } from "@/features/notifications/types";

const PAGE_SIZE = 20;

export function NotificationsPage() {
  const [offset, setOffset] = useState(0);
  const { data, isLoading, isError } = useNotifications(true, PAGE_SIZE, offset);
  const { data: unread } = useUnreadCount(true);
  const markRead = useMarkNotificationsRead();

  const items = data?.items ?? [];
  const total = data?.pageInfo?.totalItems ?? 0;
  const hasNext = offset + PAGE_SIZE < total;
  const hasPrev = offset > 0;

  return (
    <div className="container mx-auto max-w-2xl py-8 px-4">
      <div className="flex items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground mt-1">
            {unread?.count ? `${unread.count} unread` : "You're all caught up"}
          </p>
        </div>
        {(unread?.count ?? 0) > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markRead.mutate({ all: true })}
            disabled={markRead.isPending}
          >
            Mark all read
          </Button>
        )}
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : isError ? (
        <p className="text-destructive">Failed to load notifications.</p>
      ) : items.length === 0 ? (
        <p className="text-muted-foreground">No notifications yet.</p>
      ) : (
        <ul className="divide-y border rounded-md">
          {items.map((n) => (
            <li key={n.id}>
              <Link
                href={notificationHref(n)}
                onClick={() => {
                  if (!n.readAt) markRead.mutate({ ids: [n.id] });
                }}
                className={`block px-4 py-3 hover:bg-muted/50 ${
                  !n.readAt ? "bg-muted/30" : ""
                }`}
              >
                <p className="text-sm">{n.message ?? "New notification"}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(n.createdAt).toLocaleString()}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {(hasPrev || hasNext) && (
        <div className="flex justify-between mt-4">
          <Button
            variant="outline"
            size="sm"
            disabled={!hasPrev}
            onClick={() => setOffset((o) => Math.max(0, o - PAGE_SIZE))}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!hasNext}
            onClick={() => setOffset((o) => o + PAGE_SIZE)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
