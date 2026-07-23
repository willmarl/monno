import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchLogs,
  fetchStats,
  fetchForceError,
  fetchEmailSettings,
  updateEmailSettings,
  sendTestEmail,
  composeAdminEmail,
} from "./api";
import type {
  ComposeEmailInput,
  UpdateEmailSettingsInput,
} from "./settings/types";

export function useLogs(page: number, limit: number) {
  const offset = (page - 1) * limit;

  return useQuery({
    queryKey: ["logs", page],
    queryFn: () => fetchLogs({ limit, offset }),
  });
}

export function useStats(refetchInterval?: number) {
  return useQuery({
    queryKey: ["admin-stats"],
    queryFn: fetchStats,
    refetchInterval: refetchInterval ?? 1000, // 1s
  });
}

export function useForceError() {
  return useMutation({
    mutationFn: fetchForceError,
  });
}

export const emailSettingsQueryKey = ["admin-email-settings"] as const;

export function useEmailSettings() {
  return useQuery({
    queryKey: emailSettingsQueryKey,
    queryFn: fetchEmailSettings,
  });
}

export function useUpdateEmailSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateEmailSettingsInput) => updateEmailSettings(data),
    onSuccess: (data) => {
      qc.setQueryData(emailSettingsQueryKey, data);
    },
  });
}

export function useSendTestEmail() {
  return useMutation({
    mutationFn: sendTestEmail,
  });
}

export function useComposeAdminEmail() {
  return useMutation({
    mutationFn: (data: ComposeEmailInput) => composeAdminEmail(data),
  });
}
