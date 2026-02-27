import { useQuery } from "@tanstack/react-query";
import { fetchLogs, fetchStats } from "./api";

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
