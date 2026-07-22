"use client";

import { ShieldAlert } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/modal/ConfirmModal";
import { useModal } from "@/components/providers/ModalProvider";
import { useSessionUser } from "@/features/auth/hooks";
import { useAdminDeletePost } from "@/features/posts/hooks";
import { useAdminDeleteArticle } from "@/features/admin/articles/hooks";
import { useAdminDeleteComment } from "@/features/comments/hooks";
import { useAdminDeleteCollection } from "@/features/collections/hooks";

export type AdminRemovableType = "POST" | "ARTICLE" | "COMMENT" | "COLLECTION";

const LABELS: Record<AdminRemovableType, string> = {
  POST: "post",
  ARTICLE: "article",
  COMMENT: "comment",
  COLLECTION: "collection",
};

/**
 * Soft-delete any content from public pages without opening the admin dashboard.
 * ADMIN only (MOD deferred). Uses existing /admin/* delete endpoints + audit log.
 */
export function AdminRemoveButton({
  resourceType,
  resourceId,
  onRemoved,
}: {
  resourceType: AdminRemovableType;
  resourceId: number;
  /** Called after successful soft-delete (overrides default detail-page redirect). */
  onRemoved?: () => void;
}) {
  const { data: user } = useSessionUser();
  const { openModal, closeModal } = useModal();
  const router = useRouter();
  const pathname = usePathname();
  const qc = useQueryClient();

  const deletePost = useAdminDeletePost();
  const deleteArticle = useAdminDeleteArticle();
  const deleteComment = useAdminDeleteComment();
  const deleteCollection = useAdminDeleteCollection();

  if (user?.role !== "ADMIN") return null;

  const label = LABELS[resourceType];
  const pending =
    deletePost.isPending ||
    deleteArticle.isPending ||
    deleteComment.isPending ||
    deleteCollection.isPending;

  const invalidatePublic = () => {
    if (resourceType === "POST") {
      qc.invalidateQueries({ queryKey: ["posts"], exact: false });
      qc.invalidateQueries({ queryKey: ["post"], exact: false });
      qc.invalidateQueries({ queryKey: ["posts-by-user"], exact: false });
      qc.removeQueries({ queryKey: ["post", resourceId] });
    } else if (resourceType === "ARTICLE") {
      qc.invalidateQueries({ queryKey: ["articles"], exact: false });
      qc.invalidateQueries({ queryKey: ["article"], exact: false });
      qc.invalidateQueries({ queryKey: ["articles-by-user"], exact: false });
      qc.removeQueries({ queryKey: ["article", resourceId] });
    } else if (resourceType === "COMMENT") {
      qc.invalidateQueries({ queryKey: ["comments-resource"], exact: false });
      qc.invalidateQueries({ queryKey: ["comment"], exact: false });
    } else {
      qc.invalidateQueries({ queryKey: ["collections"], exact: false });
      qc.invalidateQueries({ queryKey: ["collection"], exact: false });
      qc.invalidateQueries({ queryKey: ["collections-by-user"], exact: false });
      qc.removeQueries({ queryKey: ["collection", resourceId] });
    }
  };

  const leaveDetailIfNeeded = () => {
    if (onRemoved) {
      onRemoved();
      return;
    }
    if (resourceType === "POST" && pathname === `/post/${resourceId}`) {
      router.push("/");
    } else if (
      resourceType === "ARTICLE" &&
      pathname === `/article/${resourceId}`
    ) {
      router.push("/article");
    } else if (
      resourceType === "COLLECTION" &&
      pathname === `/collection/${resourceId}`
    ) {
      router.push("/collections");
    }
  };

  const runDelete = () => {
    const opts = {
      onSuccess: () => {
        closeModal();
        invalidatePublic();
        toast.success(`Removed ${label} (admin)`);
        leaveDetailIfNeeded();
      },
      onError: (error: Error) => {
        toast.error(error.message || `Failed to remove ${label}`);
      },
    };

    if (resourceType === "POST") deletePost.mutate(resourceId, opts);
    else if (resourceType === "ARTICLE") deleteArticle.mutate(resourceId, opts);
    else if (resourceType === "COMMENT") deleteComment.mutate(resourceId, opts);
    else deleteCollection.mutate(resourceId, opts);
  };

  return (
    <Button
      size="sm"
      variant="ghost"
      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
      title="Admin remove"
      disabled={pending}
      onClick={() => {
        openModal({
          title: "Admin remove",
          content: (
            <ConfirmModal
              message={`Soft-delete this ${label} as admin? It will disappear from public pages but remain in the admin dashboard for restore/audit.`}
              buttonMessage="Remove"
              variant="destructive"
              showCancelButton
              onCancel={closeModal}
              onConfirm={runDelete}
            />
          ),
        });
      }}
    >
      <ShieldAlert className="h-4 w-4" />
    </Button>
  );
}
