/**
 * Canonical public origin for robots.txt / sitemap.xml absolute URLs.
 *
 * Prefer SITE_URL at runtime (Docker-friendly; not baked into the client bundle).
 * NEXT_PUBLIC_SITE_URL works too if you only set public web env.
 */
export function getSiteUrl(): string {
  const raw =
    process.env.SITE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "http://localhost:3000";
  return raw.replace(/\/$/, "");
}
