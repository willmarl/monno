/**
 * HTTP security headers for Next.js (`next.config.ts` `headers()`).
 * CSP allowlists third parties used by this app (PostHog, Sentry, Stripe).
 */

function originFromUrl(url: string | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

/** Host from a Sentry DSN (`https://key@oNNN.ingest….sentry.io/project`). */
function sentryIngestOrigin(dsn: string | undefined): string | null {
  if (!dsn) return null;
  try {
    const withUser = dsn.includes("@") ? `https://${dsn.split("@")[1]}` : dsn;
    return new URL(withUser).origin;
  } catch {
    return null;
  }
}

export function buildContentSecurityPolicy(env: {
  isProd: boolean;
  apiUrl?: string;
  posthogHost?: string;
  sentryDsn?: string;
  siteUrl?: string;
}): string {
  const connect = new Set<string>(["'self'"]);
  const api = originFromUrl(env.apiUrl);
  if (api) connect.add(api);
  const site = originFromUrl(env.siteUrl);
  if (site) connect.add(site);

  const posthog = originFromUrl(env.posthogHost);
  if (posthog) connect.add(posthog);
  // PostHog SDKs also talk to regional / app hosts
  connect.add("https://*.posthog.com");
  connect.add("https://us.i.posthog.com");
  connect.add("https://eu.i.posthog.com");

  const sentry = sentryIngestOrigin(env.sentryDsn);
  if (sentry) connect.add(sentry);
  connect.add("https://*.ingest.sentry.io");
  connect.add("https://*.ingest.us.sentry.io");

  connect.add("https://api.stripe.com");
  connect.add("https://*.stripe.com");

  const scriptSrc = [
    "'self'",
    "'unsafe-inline'",
    ...(env.isProd ? [] : ["'unsafe-eval'"]),
    "https://js.stripe.com",
    "https://*.posthog.com",
  ];

  // Avatars/media are absolute URLs on the API (often http://localhost in dev).
  // `https:` alone does not allow http:// API origins.
  const imgSrc = new Set<string>(["'self'", "data:", "blob:", "https:"]);
  if (api) imgSrc.add(api);
  if (!env.isProd) imgSrc.add("http:");

  const directives: string[] = [
    "default-src 'self'",
    `script-src ${scriptSrc.join(" ")}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src ${Array.from(imgSrc).join(" ")}`,
    "font-src 'self' data:",
    `connect-src ${Array.from(connect).join(" ")}`,
    "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://checkout.stripe.com",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self' https://checkout.stripe.com https://billing.stripe.com",
    "frame-ancestors 'none'",
  ];

  if (env.isProd) {
    directives.push("upgrade-insecure-requests");
  }

  return directives.join("; ");
}

export function buildSecurityHeaders(env: {
  isProd: boolean;
  apiUrl?: string;
  posthogHost?: string;
  sentryDsn?: string;
  siteUrl?: string;
}): { key: string; value: string }[] {
  const headers: { key: string; value: string }[] = [
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    {
      key: "Permissions-Policy",
      value:
        "camera=(), microphone=(), geolocation=(), interest-cohort=(), payment=(self \"https://js.stripe.com\")",
    },
    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
    {
      key: "Content-Security-Policy",
      value: buildContentSecurityPolicy(env),
    },
  ];

  if (env.isProd) {
    headers.push({
      key: "Strict-Transport-Security",
      value: "max-age=63072000; includeSubDomains; preload",
    });
  }

  return headers;
}
