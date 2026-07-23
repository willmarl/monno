"use client";

import { Button } from "@/components/ui/button";
import { useModal } from "@/components/providers/ModalProvider";
import { ConfirmModal } from "@/components/modal/ConfirmModal";

type SoftDeletable = { id: number; deleted?: boolean };

interface AdminBulkActionsBarProps {
  selected: SoftDeletable[];
  onClear: () => void;
  onBulkDelete: (ids: number[]) => Promise<unknown> | unknown;
  onBulkRestore: (ids: number[]) => Promise<unknown> | unknown;
  isPending?: boolean;
  resourceLabel?: string;
}

/**
 * Toolbar for admin tables with row selection: soft-delete active rows,
 * restore already-deleted rows. Mixed selection can use both actions.
 */
export function AdminBulkActionsBar({
  selected,
  onClear,
  onBulkDelete,
  onBulkRestore,
  isPending = false,
  resourceLabel = "items",
}: AdminBulkActionsBarProps) {
  const { openModal, closeModal } = useModal();

  if (selected.length === 0) return null;

  const toDelete = selected.filter((r) => !r.deleted).map((r) => r.id);
  const toRestore = selected.filter((r) => r.deleted).map((r) => r.id);

  const confirmDelete = () => {
    openModal({
      title: "Delete selected?",
      content: (
        <ConfirmModal
          message={`Soft-delete ${toDelete.length} ${resourceLabel}? They can be restored later.`}
          variant="destructive"
          buttonMessage="Delete"
          showCancelButton
          onCancel={closeModal}
          onConfirm={async () => {
            closeModal();
            await onBulkDelete(toDelete);
            onClear();
          }}
        />
      ),
    });
  };

  const confirmRestore = () => {
    openModal({
      title: "Restore selected?",
      content: (
        <ConfirmModal
          message={`Restore ${toRestore.length} ${resourceLabel}?`}
          buttonMessage="Restore"
          showCancelButton
          onCancel={closeModal}
          onConfirm={async () => {
            closeModal();
            await onBulkRestore(toRestore);
            onClear();
          }}
        />
      ),
    });
  };

  return (
    <div className="mb-3 flex flex-wrap items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm">
      <span className="text-muted-foreground">
        {selected.length} selected
        {toDelete.length > 0 && toRestore.length > 0
          ? ` (${toDelete.length} active, ${toRestore.length} deleted)`
          : ""}
      </span>
      <div className="ml-auto flex flex-wrap gap-2">
        {toDelete.length > 0 && (
          <Button
            type="button"
            size="sm"
            variant="destructive"
            disabled={isPending}
            onClick={confirmDelete}
          >
            Delete ({toDelete.length})
          </Button>
        )}
        {toRestore.length > 0 && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={confirmRestore}
          >
            Restore ({toRestore.length})
          </Button>
        )}
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={isPending}
          onClick={onClear}
        >
          Clear
        </Button>
      </div>
    </div>
  );
}
