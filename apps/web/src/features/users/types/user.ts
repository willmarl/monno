import { PaginatedResponse } from "@/types/pagination";
import { StringFormatParams } from "zod/v4/core";

export type UsersList = PaginatedResponse<User>;

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
}

export interface PublicUser {
  id: number;
  username: string;
  avatarPath: string | null;
  createdAt: string;
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
  password?: StringFormatParams;
}
