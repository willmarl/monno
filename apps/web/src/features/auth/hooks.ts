import { fetcher } from "@/lib/fetcher";
import { User } from "../users/types/user";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { setRefreshCallback } from "@/lib/kyClient";
import {
  login,
  register,
  logoutAll,
  fetchSessions,
  revokeSession,
  sendVerificationEmail,
  verifyEmailToken,
  requestPasswordReset,
  resetPassword,
} from "./api";

export function useLogin(path = "/") {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: login,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["session"] });
      window.location.href = path;
    },
    throwOnError: false, // Don't throw errors, let component handle them
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: register,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["session"] });
      window.location.href = "/";
    },
    throwOnError: false, // Don't throw errors, let component handle them
  });
}

export const useSessionUser = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Register callback so kyClient can invalidate this cache after token refresh
    setRefreshCallback(() => {
      queryClient.invalidateQueries({ queryKey: ["session"] });
    });
  }, [queryClient]);

  return useQuery<User | undefined>({
    queryKey: ["session"],
    queryFn: () => fetcher<User>("/users/me"),
    retry: false,
    throwOnError: false,
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => fetcher("/auth/logout", { method: "POST" }),
    onSuccess: () => {
      // Clear all auth-related caches
      queryClient.invalidateQueries({ queryKey: ["session"] });
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      window.location.href = "/login";
    },
    throwOnError: false,
  });
};

export const useLogoutAll = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: logoutAll,
    onSuccess: () => {
      // Clear all auth-related caches
      queryClient.invalidateQueries({ queryKey: ["session"] });
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      window.location.href = "/login";
    },
    throwOnError: false,
  });
};

export const useSessions = () => {
  return useQuery({
    queryKey: ["sessions"],
    queryFn: fetchSessions,
    retry: false,
    throwOnError: false,
  });
};

export const useRevokeSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: revokeSession,
    onSuccess: () => {
      // Invalidate both sessions and user session cache
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      queryClient.invalidateQueries({ queryKey: ["session"] });
      // Just in case, Redirect to login immediately.
      // window.location.href = "/login";
    },
    throwOnError: false,
  });
};

export const useSendVerificationEmail = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: sendVerificationEmail,
    onSuccess: () => {
      // Refresh user data to reflect any changes
      queryClient.invalidateQueries({ queryKey: ["session"] });
    },
    throwOnError: false,
  });
};

export const useVerifyEmailToken = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: verifyEmailToken,
    onSuccess: () => {
      // Refresh user data to reflect email verification
      queryClient.invalidateQueries({ queryKey: ["session"] });
    },
    throwOnError: false,
  });
};

export const useRequestPasswordReset = () => {
  return useMutation({
    mutationFn: requestPasswordReset,
    throwOnError: false,
  });
};

export const useResetPassword = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      token,
      newPassword,
    }: {
      token: string;
      newPassword: string;
    }) => resetPassword(token, newPassword),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["session"] });
    },
    throwOnError: false,
  });
};
