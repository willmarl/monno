import { fetcher } from "@/lib/fetcher";
import { AuditLogList, DashboardStats } from "./types";

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
