import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  updateProfile,
  changePassword,
  fetchUserByUsername,
  fetchAdminUsers,
  fetchAdminUserById,
  updateAdminUser,
  deleteAdminUser,
  createAdminUser,
} from "./api";
import type { PublicUser, UpdateProfileInput } from "./types/user";

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ data, file }: { data: UpdateProfileInput; file?: File }) =>
      updateProfile(data, file),
    throwOnError: false,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["session"] });
    },
  });
};

export const useChangePassword = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: changePassword,
    throwOnError: false,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["session"] });
    },
  });
};

export const useFetchUserByUsername = (username: string) =>
  useQuery<PublicUser>({
    queryKey: ["user", username],
    queryFn: () => fetchUserByUsername(username),
    enabled: !!username,
    throwOnError: false,
    retry: (failureCount, error: any) => {
      // Don't retry on 404 errors (user not found)
      if (error?.statusCode === 404) {
        return false;
      }
      // Retry other errors up to 3 times
      return failureCount < 3;
    },
  });

export function useAdminUsers(
  page: number = 1,
  limit: number = 10,
  query?: string,
  options?: {
    searchFields?: string;
    sort?: string;
    caseSensitive?: boolean;
    roles?: string;
    statuses?: string;
  },
) {
  const offset = (page - 1) * limit;

  return useQuery({
    queryKey: [
      "adminUsers",
      page,
      query,
      options?.searchFields,
      options?.sort,
      options?.caseSensitive,
      options?.roles,
      options?.statuses,
    ],
    queryFn: () =>
      fetchAdminUsers({
        query,
        limit,
        offset,
        searchFields: options?.searchFields,
        sort: options?.sort,
        caseSensitive: options?.caseSensitive,
        roles: options?.roles,
        statuses: options?.statuses,
      }),
  });
}

export function useUsersByIdAdmin(id: number) {
  return useQuery({
    queryKey: ["adminUser", id],
    queryFn: () => fetchAdminUserById(id),
    enabled: !!id,
  });
}

export function useCreateAdminUser() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: createAdminUser,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminUser"] });
    },
    throwOnError: false, // Don't throw errors, let component handle them
  });
}

export function useUpdateAdminUser() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
      file,
    }: {
      id: number;
      data: Parameters<typeof updateAdminUser>[1];
      file?: File;
    }) => updateAdminUser(id, data, file),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ["users"] });
      qc.invalidateQueries({ queryKey: ["adminUsers", id] });
    },
    throwOnError: false, // Don't throw errors, let component handle them
  });
}

export function useDeleteAdminUser() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: deleteAdminUser,
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ["users"] });
      qc.removeQueries({ queryKey: ["adminUser", id] });
    },
    throwOnError: false, // Don't throw errors, let component handle them
  });
}
