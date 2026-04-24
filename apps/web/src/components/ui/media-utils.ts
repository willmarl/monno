import type { Dispatch, SetStateAction } from "react";
import { UnifiedMediaItem, ALLOWED_IMAGE_TYPES } from "./MediaManager";

// ── Level 1: Pure utils ────────────────────────────────────────────────────

export interface MediaLike {
  id: number;
  original: string;
  thumbnail: string | null;
  mimeType: string;
  isPrimary: boolean;
}

export function toUnified(m: MediaLike): UnifiedMediaItem {
  return {
    kind: "existing",
    localId: `e-${m.id}`,
    id: m.id,
    original: m.original,
    thumbnail: m.thumbnail,
    mimeType: m.mimeType,
    isPrimary: m.isPrimary,
    pendingRemoval: false,
  };
}

export function validateQueuedFiles(items: UnifiedMediaItem[]): boolean {
  return !items.some(
    (i) => i.kind === "queued" && !ALLOWED_IMAGE_TYPES.includes(i.file.type as any)
  );
}

export function revokeQueuedPreviews(items: UnifiedMediaItem[]): void {
  items.forEach((i) => {
    if (i.kind === "queued") URL.revokeObjectURL(i.preview);
  });
}

// ── Level 2: Handler factory ───────────────────────────────────────────────

export function createMediaHandlers(
  setItems: Dispatch<SetStateAction<UnifiedMediaItem[]>>,
  maxCount: number
) {
  function handleFilesDropped(files: File[]) {
    const newItems: UnifiedMediaItem[] = files.map((f) => ({
      kind: "queued" as const,
      localId: crypto.randomUUID(),
      file: f,
      preview: URL.createObjectURL(f),
      isPrimary: false,
    }));
    setItems((prev) =>
      [...prev, ...newItems].slice(
        0,
        maxCount + prev.filter((i) => i.kind === "existing" && i.pendingRemoval).length
      )
    );
  }

  function handleRemove(localId: string) {
    setItems((prev) =>
      prev.flatMap((i) => {
        if (i.localId !== localId) return [i];
        if (i.kind === "queued") { URL.revokeObjectURL(i.preview); return []; }
        return [{ ...i, pendingRemoval: true, isPrimary: false }];
      })
    );
  }

  function handleUndoRemove(localId: string) {
    setItems((prev) =>
      prev.map((i) =>
        i.localId === localId && i.kind === "existing" ? { ...i, pendingRemoval: false } : i
      )
    );
  }

  function handleSetPrimary(localId: string) {
    setItems((prev) => prev.map((i) => ({ ...i, isPrimary: i.localId === localId })));
  }

  return { handleFilesDropped, handleRemove, handleUndoRemove, handleSetPrimary };
}

// ── Level 3: Async submit helpers ─────────────────────────────────────────

export interface ApplyMediaChangesParams {
  items: UnifiedMediaItem[];
  sortedMedia: { id: number; isPrimary?: boolean }[];
  addFn: (files: File[]) => Promise<{ id: number }[]>;
  removeFn: (id: number) => Promise<unknown>;
  setPrimaryFn: (id: number) => Promise<unknown>;
  reorderFn: (ids: number[]) => Promise<unknown>;
}

export async function applyMediaChanges({
  items,
  sortedMedia,
  addFn,
  removeFn,
  setPrimaryFn,
  reorderFn,
}: ApplyMediaChangesParams): Promise<void> {
  const toDelete = items.filter(
    (i): i is Extract<UnifiedMediaItem, { kind: "existing" }> =>
      i.kind === "existing" && i.pendingRemoval
  );
  const activeItems = items.filter((i) => !(i.kind === "existing" && i.pendingRemoval));
  const queuedItems = activeItems.filter(
    (i): i is Extract<UnifiedMediaItem, { kind: "queued" }> => i.kind === "queued"
  );
  const existingActive = activeItems.filter(
    (i): i is Extract<UnifiedMediaItem, { kind: "existing" }> => i.kind === "existing"
  );

  for (const item of toDelete) {
    await removeFn(item.id);
  }

  let uploadedMedia: { id: number }[] = [];
  if (queuedItems.length > 0) {
    uploadedMedia = await addFn(queuedItems.map((i) => i.file));
  }

  const localIdToRealId = new Map<string, number>();
  existingActive.forEach((i) => localIdToRealId.set(i.localId, i.id));
  queuedItems.forEach((item, idx) => {
    if (uploadedMedia[idx]) localIdToRealId.set(item.localId, uploadedMedia[idx].id);
  });

  const finalIds = activeItems
    .map((i) => localIdToRealId.get(i.localId))
    .filter((id): id is number => id !== undefined);

  if (finalIds.length > 1) {
    const originalActiveIds = sortedMedia
      .filter((m) => !toDelete.some((d) => d.id === m.id))
      .map((m) => m.id);
    const existingNewOrder = existingActive.map((i) => i.id);
    const orderChanged = JSON.stringify(originalActiveIds) !== JSON.stringify(existingNewOrder);
    if (orderChanged || uploadedMedia.length > 0) {
      await reorderFn(finalIds);
    }
  }

  const primaryItem = activeItems.find((i) => i.isPrimary);
  const originalPrimaryId = sortedMedia.find((m) => m.isPrimary)?.id;
  const newPrimaryId = primaryItem ? localIdToRealId.get(primaryItem.localId) : undefined;
  if (newPrimaryId !== undefined && newPrimaryId !== originalPrimaryId) {
    await setPrimaryFn(newPrimaryId);
  }

  revokeQueuedPreviews(items);
}

export async function applyCreateMediaChanges({
  items,
  addFn,
  setPrimaryFn,
}: {
  items: UnifiedMediaItem[];
  addFn: (files: File[]) => Promise<{ id: number }[]>;
  setPrimaryFn: (mediaId: number) => Promise<unknown>;
}): Promise<void> {
  const queued = items.filter(
    (i): i is Extract<UnifiedMediaItem, { kind: "queued" }> => i.kind === "queued"
  );
  if (queued.length === 0) return;

  const uploaded = await addFn(queued.map((i) => i.file));
  const primaryIdx = items.findIndex((i) => i.isPrimary);
  if (primaryIdx >= 0 && uploaded[primaryIdx]) {
    await setPrimaryFn(uploaded[primaryIdx].id);
  }
  revokeQueuedPreviews(items);
}
