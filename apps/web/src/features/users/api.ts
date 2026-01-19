import { api } from "@/lib/kyClient";
import { fetcher } from "@/lib/fetcher";

import type {
  User,
  UsersList,
  PublicUser,
  UpdateProfileInput,
  ChangePasswordInput,
  UpdateUserAdminInput,
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

//==============
//   Admin
//==============

export const fetchUsersAdmin = ({
  limit,
  offset,
}: {
  limit: number;
  offset: number;
}) =>
  fetcher<UsersList>("/admin/users", {
    searchParams: { limit, offset },
  });

export const fetchUserByIdAdmin = (id: number) =>
  fetcher<User[]>(`/admin/users/${id}`);

export const createUserAdmin = (payload: {
  username: string;
  email?: string;
  password: string;
}) => {
  return fetcher("/admin/users", {
    method: "POST",
    json: payload,
  });
};

export const updateUserAdmin = (id: number, data: UpdateUserAdminInput) =>
  fetcher<User>(`/admin/users/${id}`, {
    method: "PATCH",
    json: data,
  });

export const deleteUserAdmin = (id: number) =>
  fetcher<void>(`/admin/users/${id}`, {
    method: "DELETE",
  });
