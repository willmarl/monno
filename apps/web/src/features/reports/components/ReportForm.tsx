"use client";

import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useModal } from "@/components/providers/ModalProvider";
import { useCreateReport } from "@/features/reports/hooks";
import {
  REPORT_REASONS,
  type ReportableResourceType,
  type ReportReason,
} from "@/features/reports/types/report";

const REASON_LABELS: Record<ReportReason, string> = {
  SPAM: "Spam",
  HARASSMENT: "Harassment",
  HATE: "Hate / abuse",
  NSFW: "NSFW / sexual content",
  MISINFORMATION: "Misinformation",
  COPYRIGHT: "Copyright",
  OTHER: "Other",
};

type FormValues = {
  reason: ReportReason;
  details: string;
};

export function ReportForm({
  resourceType,
  resourceId,
}: {
  resourceType: ReportableResourceType;
  resourceId: number;
}) {
  const { closeModal } = useModal();
  const createReport = useCreateReport();
  const form = useForm<FormValues>({
    defaultValues: { reason: "SPAM", details: "" },
  });

  const onSubmit = form.handleSubmit((values) => {
    createReport.mutate(
      {
        resourceType,
        resourceId,
        reason: values.reason,
        details: values.details.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success("Report submitted");
          closeModal();
        },
        onError: (error) => {
          toast.error(error.message || "Failed to submit report");
        },
      },
    );
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="reason">
          Reason
        </label>
        <select
          id="reason"
          className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
          {...form.register("reason")}
        >
          {REPORT_REASONS.map((reason) => (
            <option key={reason} value={reason}>
              {REASON_LABELS[reason]}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="details">
          Details (optional)
        </label>
        <Textarea
          id="details"
          rows={4}
          maxLength={2000}
          placeholder="Anything that helps moderators review this…"
          {...form.register("details")}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={closeModal}>
          Cancel
        </Button>
        <Button type="submit" disabled={createReport.isPending}>
          Submit report
        </Button>
      </div>
    </form>
  );
}
