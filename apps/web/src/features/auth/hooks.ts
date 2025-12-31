import { fetcher } from "@/lib/fetcher";
import { User } from "./types/user";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { login, register } from "./api";

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
