import { fetcher } from "@/lib/fetcher";
import type {
  PublicUser,
  UpdateProfileInput,
  ChangePasswordInput,
} from "./types/user";

export const updateProfile = (data: UpdateProfileInput) =>
  fetcher("/users/me", {
    method: "PATCH",
    json: data,
  });

export const changePassword = (data: ChangePasswordInput) =>
  fetcher("/users/me/password", {
    method: "PATCH",
    json: data,
  });

export const fetchUserByUsername = (username: string): Promise<PublicUser> =>
  fetcher(`/users/username/${username}`, {
    method: "GET",
  });
