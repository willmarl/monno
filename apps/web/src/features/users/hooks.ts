import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  updateProfile,
  changePassword,
  fetchUserByUsername,
  fetchUsersAdmin,
  fetchUserByIdAdmin,
  updateUserAdmin,
  deleteUserAdmin,
  createUserAdmin,
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

export function useUsersAdmin(page: number, limit: number) {
  const offset = (page - 1) * limit;

  return useQuery({
    queryKey: ["usersAdmin", page],
    queryFn: () => fetchUsersAdmin({ limit, offset }),
  });
}

export function useUsersByIdAdmin(id: number) {
  return useQuery({
    queryKey: ["userAdmin", id],
    queryFn: () => fetchUserByIdAdmin(id),
    enabled: !!id,
  });
}

export function useCreateUserAdmin() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: createUserAdmin,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["userAdmin"] });
    },
    throwOnError: false, // Don't throw errors, let component handle them
  });
}

export function useUpdateUserAdmin() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: Parameters<typeof updateUserAdmin>[1];
    }) => updateUserAdmin(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ["usersAdmin"] });
      qc.invalidateQueries({ queryKey: ["userAdmin", id] });
    },
    throwOnError: false, // Don't throw errors, let component handle them
  });
}

export function useDeleteUserAdmin() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: deleteUserAdmin,
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ["usersAdmin"] });
      qc.removeQueries({ queryKey: ["userAdmin", id] });
    },
    throwOnError: false, // Don't throw errors, let component handle them
  });
}
