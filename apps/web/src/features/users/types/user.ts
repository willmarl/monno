import { PaginatedResponse } from "@/types/pagination";
import { TierName, SubscriptionStatus } from "@/features/stripe/types/stripe";

export type UserStatus = "ACTIVE" | "SUSPENDED" | "BANNED" | "DELETED";

export type UsersList = PaginatedResponse<User>;

interface SubscriptionData {
  status: SubscriptionStatus;
  tier: TierName;
  nextTier: TierName;
}

export interface User {
  id: number;
  username: string;
  email: string | null;
  avatarPath: string | null;
  password: string | null;
  createdAt: Date;
  updatedAt: Date;
  refreshToken: string | null;
  role: "USER" | "ADMIN" | "MOD";
  googleId: string | null;
  githubId: string | null;
  tempEmail: string | null;
  emailVerifiedAt: Date | null;
  isEmailVerified: boolean;
  status: UserStatus;
  statusExpireAt: Date | null;
  statusReason: string | null;
  deleted: boolean;
  deletedAt: Date | null;
  subscription: SubscriptionData;
  credits: number;
}

export interface PublicUser {
  id: number;
  username: string;
  avatarPath: string | null;
  createdAt: string;
  status: UserStatus;
  deleted: boolean;
  deletedAt: Date | null;
}
export interface UsernameHistory {
  id: number;
  userId: number;
  username: string;
  freedAt: string;
  reason: string | null;
}

export type UsernameHistoryList = PaginatedResponse<UsernameHistory>;

export interface AdminViewHistoryResource {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  deleted: boolean;
  deletedAt: string | null;
  visibility?: "PUBLIC" | "PRIVATE";
  status?: string;
  viewCount: number;
  likeCount: number;
  creator: {
    id: number;
    username: string;
    avatarPath: string | null;
  };
}

export interface AdminViewHistoryItem {
  historyId: number;
  resourceType: "POST" | "ARTICLE";
  resourceId: number;
  viewedAt: string;
  createdAt: string;
  deleted: boolean;
  deletedAt: string | null;
  resource: AdminViewHistoryResource | null;
}

export interface AdminViewHistoryList {
  user: { id: number; username: string };
  items: AdminViewHistoryItem[];
  pageInfo: {
    totalItems: number;
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export interface UpdateProfileInput {
  username?: string;
  email?: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateUserAdminInput {
  username?: string;
  email?: string;
  password?: string;
  avatarPath?: string;
  role?: "ADMIN" | "MOD" | "USER";
  status?: "ACTIVE" | "SUSPENDED" | "BANNED" | "DELETED";
  statusReason?: string;
  statusExpireAt?: string | null;
}
