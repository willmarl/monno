import * as path from 'path';

/**
 * Resolve `segments` under `root` and return the absolute path only if the
 * result stays inside the root directory. Returns null on escape attempts.
 *
 * Uses path.resolve (not normalize + startsWith) so `/uploads` cannot be
 * bypassed by `/uploads_evil/...`.
 */
export function resolveWithinRoot(
  root: string,
  ...segments: string[]
): string | null {
  const resolvedRoot = path.resolve(root);
  const candidate = path.resolve(resolvedRoot, ...segments);
  const prefix = resolvedRoot.endsWith(path.sep)
    ? resolvedRoot
    : resolvedRoot + path.sep;

  if (candidate !== resolvedRoot && !candidate.startsWith(prefix)) {
    return null;
  }

  return candidate;
}
