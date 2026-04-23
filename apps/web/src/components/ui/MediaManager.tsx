"use client";

import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { ImageIcon, RotateCcw, Star, Trash2, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type UnifiedMediaItem =
  | {
      kind: "existing";
      localId: string;
      id: number;
      original: string;
      thumbnail: string | null;
      mimeType: string;
      isPrimary: boolean;
      pendingRemoval: boolean;
    }
  | {
      kind: "queued";
      localId: string;
      file: File;
      preview: string;
      isPrimary: boolean;
    };

export interface MediaManagerProps {
  items: UnifiedMediaItem[];
  maxCount: number;
  accept?: Record<string, string[]>;
  maxSize?: number;
  isBusy?: boolean;
  onFilesDropped: (files: File[]) => void;
  onRemove: (localId: string) => void;
  onUndoRemove?: (localId: string) => void;
  onSetPrimary: (localId: string) => void;
  onReorder: (reordered: UnifiedMediaItem[]) => void;
}

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

const DEFAULT_ACCEPT: Record<string, string[]> = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
  "image/gif": [".gif"],
};
const DEFAULT_MAX_SIZE = 5 * 1024 * 1024;

export function MediaManager({
  items,
  maxCount,
  accept = DEFAULT_ACCEPT,
  maxSize = DEFAULT_MAX_SIZE,
  isBusy = false,
  onFilesDropped,
  onRemove,
  onUndoRemove,
  onSetPrimary,
  onReorder,
}: MediaManagerProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const activeCount = items.filter(
    (i) => !(i.kind === "existing" && i.pendingRemoval)
  ).length;
  const remaining = maxCount - activeCount;
  const canAdd = remaining > 0;

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept,
    maxSize,
    maxFiles: remaining,
    multiple: true,
    disabled: !canAdd || isBusy,
    onDropAccepted: onFilesDropped,
    onDropRejected: () => {},
  });

  function isPendingRemoval(item: UnifiedMediaItem) {
    return item.kind === "existing" && item.pendingRemoval;
  }

  function handleThumbDrop(targetLocalId: string) {
    if (!draggingId || draggingId === targetLocalId) {
      setDraggingId(null);
      setDragOverId(null);
      return;
    }
    const target = items.find((i) => i.localId === targetLocalId);
    if (!target || isPendingRemoval(target)) {
      setDraggingId(null);
      setDragOverId(null);
      return;
    }

    const fromIdx = items.findIndex((i) => i.localId === draggingId);
    const toIdx = items.findIndex((i) => i.localId === targetLocalId);
    const reordered = [...items];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);

    onReorder(reordered);
    setDraggingId(null);
    setDragOverId(null);
  }

  const mbLabel = (maxSize / 1024 / 1024).toFixed(0);

  return (
    <div className="space-y-3">
      {items.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {items.map((item) => {
            const pending = isPendingRemoval(item);
            const src =
              item.kind === "existing"
                ? (item.thumbnail ?? item.original)
                : item.preview;
            const mime =
              item.kind === "existing" ? item.mimeType : item.file.type;

            return (
              <div
                key={item.localId}
                draggable={!pending && !isBusy}
                onDragStart={() => !pending && setDraggingId(item.localId)}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (!pending) setDragOverId(item.localId);
                }}
                onDrop={() => handleThumbDrop(item.localId)}
                onDragEnd={() => {
                  setDraggingId(null);
                  setDragOverId(null);
                }}
                className={cn(
                  "relative h-28 w-28 shrink-0 overflow-hidden rounded-lg border border-border transition-opacity",
                  pending ? "opacity-40 cursor-default" : "cursor-grab",
                  draggingId === item.localId && "opacity-40",
                  dragOverId === item.localId &&
                    draggingId !== item.localId &&
                    "ring-2 ring-primary"
                )}
              >
                {mime.startsWith("image/") ? (
                  <img
                    src={src}
                    alt=""
                    className="h-full w-full object-cover"
                    draggable={false}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-muted">
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}

                {item.isPrimary && !pending && (
                  <div className="absolute left-1 top-1 rounded bg-yellow-400 px-1 py-0.5 text-[10px] font-semibold text-yellow-900">
                    Primary
                  </div>
                )}

                {pending ? (
                  <div className="absolute inset-0 flex items-end justify-end bg-black/20 p-1 opacity-0 transition-opacity hover:opacity-100">
                    <Button
                      type="button"
                      size="icon"
                      variant="secondary"
                      className="h-6 w-6"
                      title="Undo remove"
                      onClick={() => onUndoRemove?.(item.localId)}
                    >
                      <RotateCcw className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="absolute inset-0 flex items-end justify-between gap-1 bg-black/40 p-1 opacity-0 transition-opacity hover:opacity-100">
                    {!item.isPrimary && (
                      <Button
                        type="button"
                        size="icon"
                        variant="secondary"
                        className="h-6 w-6"
                        title="Set as primary"
                        disabled={isBusy}
                        onClick={() => onSetPrimary(item.localId)}
                      >
                        <Star className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      className="ml-auto h-6 w-6"
                      title="Remove"
                      disabled={isBusy}
                      onClick={() => onRemove(item.localId)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {canAdd ? (
        <div
          {...getRootProps()}
          className={cn(
            "rounded-lg border-2 border-dashed p-6 text-center transition-colors",
            isDragActive
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/30 bg-muted hover:bg-muted/80",
            (isBusy || !canAdd) && "cursor-not-allowed opacity-50",
            !isBusy && canAdd && "cursor-pointer"
          )}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-6 w-6 text-muted-foreground/60" />
            <p className="text-sm font-medium">
              {isDragActive
                ? "Drop files here"
                : `Add media (${activeCount}/${maxCount})`}
            </p>
            <p className="text-xs text-muted-foreground">up to {mbLabel} MB each</p>
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Limit of {maxCount} reached. Remove one to add another.
        </p>
      )}

      {items.filter((i) => !isPendingRemoval(i)).length > 1 && (
        <p className="text-xs text-muted-foreground">
          Drag thumbnails to reorder. Hover for actions.
        </p>
      )}
    </div>
  );
}
