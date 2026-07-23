/** Max IDs accepted by admin bulk soft-delete / restore endpoints. */
export const BULK_IDS_MAX = 100;

export type BulkSoftResult = {
  /** Rows that changed state (deleted or restored). */
  affected: number;
  /** Requested IDs that were missing, already in target state, or capped out. */
  skipped: number;
};

/**
 * Dedupe + positive ints + hard cap. Callers pass the capped list to updateMany.
 */
export function normalizeBulkIds(ids: number[]): number[] {
  return [
    ...new Set(
      ids.filter((id) => Number.isInteger(id) && id > 0),
    ),
  ].slice(0, BULK_IDS_MAX);
}
