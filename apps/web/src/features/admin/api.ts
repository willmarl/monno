import { fetcher } from "@/lib/fetcher";
import { AuditLogList, DashboardStats } from "./types";
import type {
  ComposeEmailInput,
  ComposeEmailResult,
  EmailSettings,
  EmailTestResult,
  UpdateEmailSettingsInput,
} from "./settings/types";

// GET /admin/logs?limit=5&offset=10
export const fetchLogs = ({
  limit,
  offset,
}: {
  limit: number;
  offset: number;
}) =>
  fetcher<AuditLogList>("/admin/logs", {
    searchParams: { limit, offset },
  });

// GET /admin/stats
export const fetchStats = () => fetcher<DashboardStats>("/admin/stats");

// GET /admin/force-error (for testing error tracking)
export const fetchForceError = () => fetcher<void>("/admin/force-error");

export const fetchEmailSettings = () =>
  fetcher<EmailSettings>("/admin/settings/email");

export const updateEmailSettings = (data: UpdateEmailSettingsInput) =>
  fetcher<EmailSettings>("/admin/settings/email", {
    method: "PATCH",
    json: data,
  });

export const sendTestEmail = () =>
  fetcher<EmailTestResult>("/admin/settings/email/test", {
    method: "POST",
  });

export const composeAdminEmail = (data: ComposeEmailInput) =>
  fetcher<ComposeEmailResult>("/admin/settings/email/compose", {
    method: "POST",
    json: data,
  });
