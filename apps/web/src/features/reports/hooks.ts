import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createReport,
  fetchAdminReports,
  updateAdminReport,
} from "./api";
import type {
  ReportableResourceType,
  ReportStatus,
  UpdateReportInput,
} from "./types/report";

export function useCreateReport() {
  return useMutation({
    mutationFn: createReport,
    throwOnError: false,
  });
}

export function useAdminReports(
  page: number,
  limit: number,
  status?: ReportStatus | "ALL",
  resourceType?: ReportableResourceType | "ALL",
  query: string = "",
) {
  const offset = (page - 1) * limit;
  return useQuery({
    queryKey: ["admin-reports", page, limit, status, resourceType, query],
    queryFn: () =>
      fetchAdminReports({
        limit,
        offset,
        status: status && status !== "ALL" ? status : undefined,
        resourceType:
          resourceType && resourceType !== "ALL" ? resourceType : undefined,
        query: query || undefined,
      }),
  });
}

export function useUpdateAdminReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateReportInput }) =>
      updateAdminReport(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-reports"], exact: false });
    },
    throwOnError: false,
  });
}
