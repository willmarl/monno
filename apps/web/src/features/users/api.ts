import { api } from "@/lib/kyClient";
import { fetcher } from "@/lib/fetcher";

import type {
  User,
  UsersList,
  PublicUser,
  UsernameHistoryList,
  AdminViewHistoryList,
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

export const deleteProfile = (password: string) =>
  fetcher<void>(`/users/me`, {
    method: "DELETE",
    json: { password },
  });

export const fetchUserByUsername = (username: string): Promise<PublicUser> =>
  fetcher(`/users/username/${username}`, {
    method: "GET",
  });

// GET /users/search/suggest?q=jane&limit=5 (public — ACTIVE only)
export const fetchUserSuggestions = (q: string, limit: number = 5) => {
  if (!q) return Promise.resolve([]);

  return fetcher<PublicUser[]>("/users/search/suggest", {
    searchParams: { q, limit },
  });
};

export type AdminUserSuggestion = Pick<
  PublicUser,
  "id" | "username" | "avatarPath" | "status" | "deleted"
>;

// Uses existing admin search (any status) — avoids a nested /search/suggest route.
export const fetchAdminUserSuggestions = async (
  q: string,
  limit: number = 5,
): Promise<AdminUserSuggestion[]> => {
  if (!q) return [];

  const result = await fetchAdminUsers({
    query: q,
    limit,
    offset: 0,
    searchFields: "username",
  });

  return result.items.map((u) => ({
    id: u.id,
    username: u.username,
    avatarPath: u.avatarPath,
    status: u.status,
    deleted: u.deleted,
  }));
};

export const fetchUsers = ({
  query,
  limit = 10,
  offset = 0,
  searchFields,
  sort,
  caseSensitive,
}: {
  query?: string;
  limit?: number;
  offset?: number;
  searchFields?: string;
  sort?: string;
  caseSensitive?: boolean;
} = {}) => {
  const searchParams: Record<string, string | number | boolean> = {
    limit,
    offset,
  };
  if (query) searchParams.query = query;
  if (searchFields) searchParams.searchFields = searchFields;
  if (sort) searchParams.sort = sort;
  if (caseSensitive) searchParams.caseSensitive = caseSensitive;

  return fetcher<UsersList>("/users", { searchParams });
};

//==============
//   Admin
//==============

export const fetchAdminUsers = ({
  query,
  limit = 10,
  offset = 0,
  searchFields,
  sort,
  caseSensitive,
  roles,
  statuses,
}: {
  query?: string;
  limit?: number;
  offset?: number;
  searchFields?: string;
  sort?: string;
  caseSensitive?: boolean;
  roles?: string;
  statuses?: string;
} = {}) => {
  const searchParams: Record<string, string | number | boolean> = {
    limit,
    offset,
  };
  if (query) searchParams.query = query;
  if (searchFields) searchParams.searchFields = searchFields;
  if (sort) searchParams.sort = sort;
  if (caseSensitive) searchParams.caseSensitive = caseSensitive;
  if (roles) searchParams.roles = roles;
  if (statuses) searchParams.statuses = statuses;

  return fetcher<UsersList>("/admin/users/search", { searchParams });
};

export const fetchAdminUserById = (id: number) =>
  fetcher<User[]>(`/admin/users/${id}`);

export const createAdminUser = (payload: {
  username: string;
  email?: string;
  password: string;
}) => {
  return fetcher("/admin/users", {
    method: "POST",
    json: payload,
  });
};

export const updateAdminUser = (
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
    json: (() => {
      const { avatarPath: _ignored, ...rest } = data;
      return rest;
    })(),
  });
};

export const deleteAdminUser = (id: number) =>
  fetcher<void>(`/admin/users/${id}`, {
    method: "DELETE",
  });

export const fetchAdminUsernameHistory = ({
  userId,
  limit,
  offset,
}: {
  userId: number;
  limit: number;
  offset: number;
}) =>
  fetcher<UsernameHistoryList>(`/admin/users/${userId}/username-history`, {
    searchParams: { limit, offset },
  });

export const fetchAdminViewHistory = ({
  userId,
  resourceType,
  limit,
  offset,
  query,
  status = "all",
}: {
  userId: number;
  resourceType: "POST" | "ARTICLE";
  limit: number;
  offset: number;
  query?: string;
  status?: "all" | "active" | "cleared";
}) => {
  const searchParams: Record<string, string | number> = {
    resourceType,
    limit,
    offset,
    status,
  };
  if (query?.trim()) searchParams.query = query.trim();
  return fetcher<AdminViewHistoryList>(
    `/admin/users/${userId}/view-history`,
    { searchParams },
  );
};

export const restoreAdminUser = (id: number) =>
  fetcher<User>(`/admin/users/${id}/restore`, {
    method: "POST",
  });
