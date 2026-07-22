import { fetcher } from "@/lib/fetcher";
import type { AppNotification, NotificationsList } from "./types";

export const fetchNotifications = (params?: {
  limit?: number;
  offset?: number;
}) => {
  const searchParams = new URLSearchParams();
  if (params?.limit != null) searchParams.set("limit", String(params.limit));
  if (params?.offset != null) searchParams.set("offset", String(params.offset));
  const q = searchParams.toString();
  return fetcher<NotificationsList>(
    `/notifications${q ? `?${q}` : ""}`,
    { method: "GET" },
  );
};

export const fetchUnreadCount = () =>
  fetcher<{ count: number }>("/notifications/unread-count", { method: "GET" });

export const markNotificationsRead = (body: {
  ids?: number[];
  all?: boolean;
}) =>
  fetcher<{ updated: number }>("/notifications/read", {
    method: "POST",
    json: body,
  });

export type { AppNotification };
