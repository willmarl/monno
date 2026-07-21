/**
 * API base URL for SERVER-SIDE fetches (RSC / SSR).
 *
 * In Docker the browser and the web container reach the api differently:
 * browser → NEXT_PUBLIC_API_URL (e.g. http://localhost:3001, baked at build),
 * web container → API_INTERNAL_URL (e.g. http://api:3001, runtime env).
 *
 * Read lazily (function, not const) so standalone Next picks up runtime env.
 */
export function serverApiUrl(): string {
  return (
    process.env.API_INTERNAL_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:3001"
  );
}
