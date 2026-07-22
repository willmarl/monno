/**
 * Visibility helpers for posts / collections.
 *
 * - PUBLIC: anyone can read (subject to soft-delete / creator ACTIVE)
 * - PRIVATE: only the creator (and admin APIs) can read
 * Likes inherit visibility from the liked resource — no column on Like.
 */

export type VisibilityValue = 'PUBLIC' | 'PRIVATE';

/** Public feed / search: only PUBLIC rows. */
export function publicVisibilityWhere() {
  return { visibility: 'PUBLIC' as const };
}

/**
 * Profile / detail reads for a single owner's content:
 * - viewer is owner → all non-deleted (PUBLIC + PRIVATE)
 * - otherwise → PUBLIC only
 */
export function visibilityWhereForViewer(
  ownerId: number,
  viewerId?: number | null,
) {
  if (viewerId != null && viewerId === ownerId) {
    return {};
  }
  return publicVisibilityWhere();
}

/**
 * Mixed-creator lists (liked-by-user, collection items, global search with own private):
 * viewer sees PUBLIC + their own PRIVATE only. Guests see PUBLIC only.
 */
export function visibilityWhereForContentViewer(viewerId?: number | null) {
  if (viewerId == null) {
    return publicVisibilityWhere();
  }
  return {
    OR: [
      { visibility: 'PUBLIC' as const },
      { visibility: 'PRIVATE' as const, creatorId: viewerId },
    ],
  };
}

export function canViewPrivateContent(
  creatorId: number,
  viewerId?: number | null,
): boolean {
  return viewerId != null && viewerId === creatorId;
}
