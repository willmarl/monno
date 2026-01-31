import { useQuery } from "@tanstack/react-query";
import { fetchLogs, fetchStats } from "./api";

interface UseLogsParams {
  limit?: number;
  offset?: number;
  adminId?: number;
  targetId?: number;
  resource?: string;
  action?: string;
}

export function useLogs(page: number, limit: number) {
  const offset = (page - 1) * limit;

  return useQuery({
    queryKey: ["posts-offset", page],
    queryFn: () => fetchLogs({ limit, offset }),
  });
}

export function useStats() {
  return useQuery({
    queryKey: ["admin-stats"],
    queryFn: fetchStats,
  });
}
