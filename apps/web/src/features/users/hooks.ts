import { useMutation, useQuery } from "@tanstack/react-query";
import type { PublicUser } from "./types/user";
import { updateProfile, changePassword, fetchUserByUsername } from "./api";

export const useUpdateProfile = () =>
  useMutation({
    mutationFn: updateProfile,
    throwOnError: false,
  });

export const useChangePassword = () =>
  useMutation({
    mutationFn: changePassword,
    throwOnError: false,
  });

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
