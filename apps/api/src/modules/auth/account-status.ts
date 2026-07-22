import { UnauthorizedException } from '@nestjs/common';

type StatusUser = {
  id: number;
  status: string;
  statusReason?: string | null;
  statusExpireAt?: Date | null;
};

/**
 * Blocks non-ACTIVE accounts. If SUSPENDED/BANNED and statusExpireAt is in the
 * past, returns `{ expired: true }` so the caller can clear the status in DB.
 * DELETED never auto-expires.
 */
export function evaluateAccountAccess(user: StatusUser): {
  ok: true;
  expired: boolean;
} {
  if (user.status === 'ACTIVE') {
    return { ok: true, expired: false };
  }

  const now = new Date();
  const expired =
    (user.status === 'SUSPENDED' || user.status === 'BANNED') &&
    !!user.statusExpireAt &&
    user.statusExpireAt < now;

  if (expired) {
    return { ok: true, expired: true };
  }

  throw new UnauthorizedException(
    `Account is ${user.status.toLowerCase()}${user.statusReason ? ': ' + user.statusReason : ''}`,
  );
}
