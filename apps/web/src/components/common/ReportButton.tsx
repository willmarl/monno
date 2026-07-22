"use client";

import { Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useModal } from "@/components/providers/ModalProvider";
import { useSessionUser } from "@/features/auth/hooks";
import { ReportForm } from "@/features/reports/components/ReportForm";
import type { ReportableResourceType } from "@/features/reports/types/report";
import { useRouter } from "next/navigation";

export function ReportButton({
  resourceType,
  resourceId,
  isOwner,
}: {
  resourceType: ReportableResourceType;
  resourceId: number;
  isOwner?: boolean;
}) {
  const { data: user } = useSessionUser();
  const { openModal } = useModal();
  const router = useRouter();

  if (isOwner) return null;

  return (
    <Button
      size="sm"
      variant="ghost"
      className="h-8 w-8 p-0"
      title="Report"
      onClick={() => {
        if (!user) {
          router.push("/login");
          return;
        }
        openModal({
          title: "Report content",
          content: (
            <ReportForm resourceType={resourceType} resourceId={resourceId} />
          ),
        });
      }}
    >
      <Flag className="h-4 w-4" />
    </Button>
  );
}
