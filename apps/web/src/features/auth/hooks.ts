import { fetcher } from "@/lib/fetcher";
import { User } from "../users/types/user";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  login,
  register,
  logoutAll,
  fetchSessions,
  revokeSession,
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
