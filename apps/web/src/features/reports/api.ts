import { fetcher } from "@/lib/fetcher";
import type {
  AdminReport,
  AdminReportList,
  CreateReportInput,
  Report,
  ReportableResourceType,
  ReportStatus,
  UpdateReportInput,
} from "./types/report";

export const createReport = (data: CreateReportInput) =>
  fetcher<Report>("/reports", {
    method: "POST",
    json: data,
  });

export const fetchAdminReports = ({
  limit = 20,
  offset = 0,
  status,
  resourceType,
  query,
}: {
  limit?: number;
  offset?: number;
  status?: ReportStatus;
  resourceType?: ReportableResourceType;
  query?: string;
}) => {
  const searchParams: Record<string, string | number> = { limit, offset };
  if (status) searchParams.status = status;
  if (resourceType) searchParams.resourceType = resourceType;
  if (query?.trim()) searchParams.query = query.trim();
  return fetcher<AdminReportList>("/admin/reports", { searchParams });
};

export const updateAdminReport = (id: number, data: UpdateReportInput) =>
  fetcher<AdminReport>(`/admin/reports/${id}`, {
    method: "PATCH",
    json: data,
  });
