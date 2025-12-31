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
