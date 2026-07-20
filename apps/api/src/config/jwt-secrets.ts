/**
 * Fail closed when JWT signing secrets are missing or empty.
 * Call once at process boot (before NestFactory.create).
 */
export function requireJwtSecrets(): {
  accessTokenSecret: string;
  refreshTokenSecret: string;
} {
  const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET?.trim() ?? '';
  const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET?.trim() ?? '';

  if (!accessTokenSecret || !refreshTokenSecret) {
    throw new Error(
      'ACCESS_TOKEN_SECRET and REFRESH_TOKEN_SECRET must be set to non-empty values',
    );
  }

  return { accessTokenSecret, refreshTokenSecret };
}
