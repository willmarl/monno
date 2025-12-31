import { api } from "@/lib/kyClient";
import { fetcher } from "@/lib/fetcher";

import type {
  PublicUser,
  UpdateProfileInput,
  ChangePasswordInput,
} from "./types/user";

function createUpdateFormData(data: UpdateProfileInput, file: File): FormData {
  const formData = new FormData();
  if (data.username) formData.append("username", data.username);
  if (data.email) formData.append("email", data.email);
  formData.append("avatar", file);
  return formData;
}

export const updateProfile = async (data: UpdateProfileInput, file?: File) => {
  // Use FormData if file is provided, otherwise JSON
  if (file) {
    const formData = createUpdateFormData(data, file);
    return api("users/me", {
      method: "PATCH",
      body: formData,
    } as any).json();
  }

  return fetcher("/users/me", {
    method: "PATCH",
    json: data,
  });
};

export const changePassword = (data: ChangePasswordInput) =>
  fetcher("/users/me/password", {
    method: "PATCH",
    json: data,
  });

export const fetchUserByUsername = (username: string): Promise<PublicUser> =>
  fetcher(`/users/username/${username}`, {
    method: "GET",
  });
