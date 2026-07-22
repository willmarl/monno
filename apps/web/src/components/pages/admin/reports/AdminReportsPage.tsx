"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { PaginatedListInline } from "@/components/ui/pagination/PaginatedListInline";
import { ProfileListSearch } from "@/components/pages/userProfile/ProfileListSearch";
import { useModal } from "@/components/providers/ModalProvider";
import {
  useAdminReports,
  useUpdateAdminReport,
} from "@/features/reports/hooks";
import {
  REPORT_STATUSES,
  REPORTABLE_RESOURCES,
  type AdminReport,
  type ReportableResourceType,
  type ReportStatus,
} from "@/features/reports/types/report";
import { formatDate } from "@/lib/utils/date";

const DEFAULT_LIMIT = 20;

function resourceHref(report: AdminReport): string | null {
  switch (report.resourceType) {
    case "POST":
      return `/post/${report.resourceId}`;
    case "ARTICLE":
      return `/article/${report.resourceId}`;
    case "COLLECTION":
      return `/collection/${report.resourceId}`;
    default:
      return null;
  }
}

function ReviewReportForm({ report }: { report: AdminReport }) {
  const { closeModal } = useModal();
  const update = useUpdateAdminReport();
  const [status, setStatus] = useState<ReportStatus>(report.status);
  const [adminNotes, setAdminNotes] = useState(report.adminNotes ?? "");

  return (
    <div className="space-y-4">
      <div className="text-sm space-y-1">
        <p>
          <span className="text-muted-foreground">Target:</span>{" "}
          {report.resourceType} #{report.resourceId}
        </p>
        <p>
          <span className="text-muted-foreground">Reason:</span> {report.reason}
        </p>
        {report.details && (
          <p>
            <span className="text-muted-foreground">Details:</span>{" "}
            {report.details}
          </p>
        )}
        <p>
          <span className="text-muted-foreground">Reporter:</span>{" "}
          {report.reporter.username}
        </p>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="status">
          Status
        </label>
        <select
          id="status"
          className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
          value={status}
          onChange={(e) => setStatus(e.target.value as ReportStatus)}
        >
          {REPORT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="notes">
          Admin notes
        </label>
        <Textarea
          id="notes"
          rows={3}
          value={adminNotes}
          onChange={(e) => setAdminNotes(e.target.value)}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={closeModal}>
          Cancel
        </Button>
        <Button
          disabled={update.isPending}
          onClick={() =>
            update.mutate(
              { id: report.id, data: { status, adminNotes } },
              {
                onSuccess: () => {
                  toast.success("Report updated");
                  closeModal();
                },
                onError: (err) => toast.error(err.message),
              },
            )
          }
        >
          Save
        </Button>
      </div>
    </div>
  );
}

function ReportRow({ report }: { report: AdminReport }) {
  const { openModal } = useModal();
  const href = resourceHref(report);

  return (
    <div className="flex flex-col gap-2 border-b border-border py-3 last:border-0 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">#{report.id}</span>
          <Badge variant="secondary">{report.status}</Badge>
          <Badge variant="outline">{report.reason}</Badge>
          <span className="text-sm text-muted-foreground">
            {report.resourceType} #{report.resourceId}
          </span>
          {href && (
            <Link href={href} className="text-sm text-primary hover:underline">
              Open
            </Link>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          by {report.reporter.username} · {formatDate(report.createdAt)}
        </p>
        {report.details && (
          <p className="text-sm line-clamp-2">{report.details}</p>
        )}
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={() =>
          openModal({
            title: `Report #${report.id}`,
            content: <ReviewReportForm report={report} />,
          })
        }
      >
        Review
      </Button>
    </div>
  );
}

export function AdminReportsPage() {
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<ReportStatus | "ALL">("OPEN");
  const [resourceType, setResourceType] = useState<
    ReportableResourceType | "ALL"
  >("ALL");

  const { data, isLoading } = useAdminReports(
    page,
    DEFAULT_LIMIT,
    status,
    resourceType,
    query,
  );

  const items = (data?.items ?? []).map((item) => ({ ...item }));
  const totalItems = data?.pageInfo?.total ?? data?.pageInfo?.totalItems ?? 0;

  return (
    <div className="container mx-auto py-10 flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
        <p className="text-sm text-muted-foreground">
          Review user reports on posts, articles, comments, and collections.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <ProfileListSearch
          placeholder="Search reporter, details, notes…"
          value={query}
          onChange={(q) => {
            setQuery(q);
            setPage(1);
          }}
        />
        <div className="mb-3 space-y-1">
          <label className="text-xs text-muted-foreground">Status</label>
          <select
            className="border-input bg-background block rounded-md border px-3 py-2 text-sm"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as ReportStatus | "ALL");
              setPage(1);
            }}
          >
            <option value="ALL">All</option>
            {REPORT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-3 space-y-1">
          <label className="text-xs text-muted-foreground">Type</label>
          <select
            className="border-input bg-background block rounded-md border px-3 py-2 text-sm"
            value={resourceType}
            onChange={(e) => {
              setResourceType(e.target.value as ReportableResourceType | "ALL");
              setPage(1);
            }}
          >
            <option value="ALL">All</option>
            {REPORTABLE_RESOURCES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      <PaginatedListInline
        page={page}
        limit={DEFAULT_LIMIT}
        items={items}
        totalItems={totalItems}
        isLoading={isLoading}
        onPageChange={setPage}
        layout="flex"
        gridClassName="flex flex-col"
        emptyMessage="No reports for this filter."
        renderItem={(report) => <ReportRow report={report} />}
      />
    </div>
  );
}
