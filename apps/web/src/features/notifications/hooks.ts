"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationsRead,
} from "./api";

export const notificationsQueryKey = ["notifications"] as const;
export const unreadCountQueryKey = ["notifications", "unread-count"] as const;

export function useNotifications(enabled: boolean, limit = 20, offset = 0) {
  return useQuery({
    queryKey: [...notificationsQueryKey, limit, offset],
    queryFn: () => fetchNotifications({ limit, offset }),
    enabled,
    staleTime: 30_000,
  });
}

export function useUnreadCount(enabled: boolean) {
  return useQuery({
    queryKey: unreadCountQueryKey,
    queryFn: fetchUnreadCount,
    enabled,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

export function useMarkNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markNotificationsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationsQueryKey });
      queryClient.invalidateQueries({ queryKey: unreadCountQueryKey });
    },
  });
}
