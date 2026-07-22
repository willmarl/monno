/**
 * Keep in sync with API `NOTIFIABLE_RESOURCES` —
 * owners of these resources get engagement (like/comment) notifications.
 */
export const NOTIFIABLE_RESOURCES = [
  "POST",
  "ARTICLE",
  "COLLECTION",
  "COMMENT",
] as const;

export type NotifiableResourceType = (typeof NOTIFIABLE_RESOURCES)[number];

export type NotificationType = "COMMENT" | "LIKE";

export type NotificationActor = {
  id: number;
  username: string;
  avatarPath: string | null;
};

export type AppNotification = {
  id: number;
  type: NotificationType;
  resourceType: string;
  resourceId: number;
  message: string | null;
  readAt: string | null;
  createdAt: string;
  actor: NotificationActor | null;
};

export type NotificationsList = {
  items: AppNotification[];
  pageInfo: {
    totalItems: number;
    limit: number;
    offset: number;
    hasNextPage?: boolean;
    hasPreviousPage?: boolean;
  };
  isRedirected?: boolean;
};

/** Detail path prefixes for click-through from the bell / list. */
const NOTIFICATION_HREF: Partial<Record<NotifiableResourceType, string>> = {
  POST: "/post",
  ARTICLE: "/article",
  COLLECTION: "/collection",
};

export function notificationHref(n: AppNotification): string {
  const prefix =
    NOTIFICATION_HREF[n.resourceType as NotifiableResourceType];
  if (prefix) return `${prefix}/${n.resourceId}`;
  return "/notifications";
}
