import { PaginatedResponse } from "@/types/pagination";
import { TierName } from "@/features/stripe/types/stripe";

export type UserStatus = "ACTIVE" | "SUSPENDED" | "BANNED" | "DELETED";

export type UsersList = PaginatedResponse<User>;

interface SubscriptionData {
  status: "ACTIVE" | "PAST_DUE" | "CANCELED";
  tier: TierName;
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
}
