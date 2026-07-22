"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchPreferences, updatePreferences } from "./api";
import type { UpdatePreferencesInput, UserPreferences } from "./types";

export const preferencesQueryKey = ["preferences"] as const;

export function usePreferences(enabled: boolean) {
  return useQuery<UserPreferences>({
    queryKey: preferencesQueryKey,
    queryFn: fetchPreferences,
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdatePreferences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdatePreferencesInput) => updatePreferences(data),
    onSuccess: (data) => {
      queryClient.setQueryData(preferencesQueryKey, data);
    },
  });
}
