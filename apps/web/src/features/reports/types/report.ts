import type { ResourceType } from "@/types/resource";

export const REPORTABLE_RESOURCES = [
  "POST",
  "ARTICLE",
  "COMMENT",
  "COLLECTION",
] as const;

export type ReportableResourceType = (typeof REPORTABLE_RESOURCES)[number];

export const REPORT_REASONS = [
  "SPAM",
  "HARASSMENT",
  "HATE",
  "NSFW",
  "MISINFORMATION",
  "COPYRIGHT",
  "OTHER",
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number];

export const REPORT_STATUSES = [
  "OPEN",
  "REVIEWING",
  "RESOLVED",
  "DISMISSED",
] as const;

export type ReportStatus = (typeof REPORT_STATUSES)[number];

export interface Report {
  id: number;
  resourceType: ReportableResourceType;
  resourceId: number;
  reason: ReportReason;
  details: string | null;
  status: ReportStatus;
  createdAt: string;
}

export interface CreateReportInput {
  resourceType: ReportableResourceType | ResourceType;
  resourceId: number;
  reason: ReportReason;
  details?: string;
}

export interface AdminReport {
  id: number;
  resourceType: ReportableResourceType;
  resourceId: number;
  reason: ReportReason;
  details: string | null;
  status: ReportStatus;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  reporter: {
    id: number;
    username: string;
    avatarPath: string | null;
  };
  resolver: {
    id: number;
    username: string;
    avatarPath: string | null;
  } | null;
}

export interface AdminReportList {
  items: AdminReport[];
  pageInfo: {
    totalItems: number;
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export interface UpdateReportInput {
  status?: ReportStatus;
  adminNotes?: string;
}
