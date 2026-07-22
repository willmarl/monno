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

export function notificationHref(n: AppNotification): string {
  switch (n.resourceType) {
    case "POST":
      return `/post/${n.resourceId}`;
    case "ARTICLE":
      return `/article/${n.resourceId}`;
    case "COLLECTION":
      return `/collection/${n.resourceId}`;
    case "COMMENT":
      // Parent resolved on email links; in-app falls back to notifications page
      return `/notifications`;
    default:
      return `/notifications`;
  }
}
