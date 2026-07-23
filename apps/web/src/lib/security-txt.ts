import { getSiteUrl } from "@/lib/site-url";

/**
 * Build RFC 9116 security.txt body.
 *
 * Required fields: Contact, Expires.
 * Configure via:
 *   SECURITY_CONTACT — full URI (mailto:… or https://…)
 *   SECURITY_CONTACT_EMAIL — email only; becomes mailto:
 *   SECURITY_TXT_EXPIRES — ISO-8601 datetime (default: now + 365 days)
 *   SECURITY_POLICY_URL — optional https Policy page
 */

function resolveContact(): string {
  const uri = process.env.SECURITY_CONTACT?.trim();
  if (uri) return uri;

  const email = process.env.SECURITY_CONTACT_EMAIL?.trim();
  if (email) {
    return email.startsWith("mailto:") ? email : `mailto:${email}`;
  }

  // Boilerplate fallback — clones should set SECURITY_CONTACT(_EMAIL) in prod
  return "mailto:security@example.com";
}

function resolveExpires(): string {
  const raw = process.env.SECURITY_TXT_EXPIRES?.trim();
  if (raw) {
    const d = new Date(raw);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }

  const d = new Date();
  // RFC recommends Expires less than a year out to avoid staleness
  d.setUTCDate(d.getUTCDate() + 364);
  return d.toISOString();
}

export function buildSecurityTxt(): string {
  const site = getSiteUrl();
  const lines: string[] = [
    "# Vulnerability disclosure (RFC 9116)",
    `# ${process.env.NEXT_PUBLIC_APP_NAME || "Monno"}`,
    `Contact: ${resolveContact()}`,
    `Expires: ${resolveExpires()}`,
    "Preferred-Languages: en",
  ];

  // RFC 9116: Canonical web URIs MUST use https://
  if (site.startsWith("https://")) {
    lines.push(`Canonical: ${site}/.well-known/security.txt`);
  }

  const policy = process.env.SECURITY_POLICY_URL?.trim();
  if (policy) {
    lines.push(`Policy: ${policy}`);
  }

  lines.push("");
  return lines.join("\n");
}
