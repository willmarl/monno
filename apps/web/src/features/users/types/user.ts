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
