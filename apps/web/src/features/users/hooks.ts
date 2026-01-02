import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { updateProfile, changePassword, fetchUserByUsername } from "./api";
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
