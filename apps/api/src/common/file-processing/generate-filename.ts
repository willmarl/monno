import { randomUUID } from 'crypto';

/**
 * Generates a unique filename for uploaded files.
 * Format: {userId}_{yyyymmdd}_{uuid}.{ext}
 *
 * To change the naming scheme, edit only this function.
 */
export function generateFilename(userId: number, ext: string): string {
  const date = new Date();
  const yyyymmdd =
    date.getFullYear().toString() +
    String(date.getMonth() + 1).padStart(2, '0') +
    String(date.getDate()).padStart(2, '0');
  return `${userId}_${yyyymmdd}_${randomUUID()}.${ext}`;
}
