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

function createFormDataWithFile(
  data: Record<string, any>,
  file: File,
): FormData {
  const formData = new FormData();

  Object.entries(data).forEach(([key, value]) => {
    // Skip empty values and avatarPath (will be replaced by actual file)
    if (value && key !== "avatarPath") {
      formData.append(key, value as string);
    }
  });

  formData.append("avatar", file);
  return formData;
}

export const updateProfile = async (data: UpdateProfileInput, file?: File) => {
  // Use FormData if file is provided, otherwise JSON
  if (file) {
    const formData = createFormDataWithFile(data, file);
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
  searchFields,
  sort,
  caseSensitive,
  roles,
  statuses,
}: {
  limit: number;
  offset: number;
  searchFields?: string;
  sort?: string;
  caseSensitive?: boolean;
  roles?: string;
  statuses?: string;
}) => {
  const searchParams: Record<string, string | number | boolean> = {
    limit,
    offset,
  };
  if (searchFields) searchParams.searchFields = searchFields;
  if (sort) searchParams.sort = sort;
  if (caseSensitive) searchParams.caseSensitive = caseSensitive;
  if (roles) searchParams.roles = roles;
  if (statuses) searchParams.statuses = statuses;

  return fetcher<UsersList>("/admin/users", { searchParams });
};

export const fetchUsersAdminSearch = ({
  query,
  limit,
  offset,
  searchFields,
  sort,
  caseSensitive,
  roles,
  statuses,
}: {
  query: string;
  limit: number;
  offset: number;
  searchFields?: string;
  sort?: string;
  caseSensitive?: boolean;
  roles?: string;
  statuses?: string;
}) => {
  if (!query) return fetchUsersAdmin({ limit, offset });

  const searchParams: Record<string, string | number | boolean> = {
    query,
    limit,
    offset,
  };
  if (searchFields) searchParams.searchFields = searchFields;
  if (sort) searchParams.sort = sort;
  if (caseSensitive) searchParams.caseSensitive = caseSensitive;
  if (roles) searchParams.roles = roles;
  if (statuses) searchParams.statuses = statuses;

  return fetcher<UsersList>("/admin/users/search", { searchParams });
};

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

export const updateUserAdmin = (
  id: number,
  data: UpdateUserAdminInput,
  file?: File,
) => {
  if (file) {
    const formData = createFormDataWithFile(data, file);
    return api(`admin/users/${id}`, {
      method: "PATCH",
      body: formData,
    } as any).json();
  }

  return fetcher(`/admin/users/${id}`, {
    method: "PATCH",
    json: data,
  });
};

export const deleteUserAdmin = (id: number) =>
  fetcher<void>(`/admin/users/${id}`, {
    method: "DELETE",
  });
