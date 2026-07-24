import type { NextConfig } from "next";
// import createNextIntlPlugin from 'next-intl/plugin'
import { withSentryConfig } from "@sentry/nextjs";
import { buildSecurityHeaders } from "./src/lib/security-headers";

const nextConfig: NextConfig = {
  // Self-contained server bundle for Docker (node apps/web/server.js)
  output: "standalone",

  async headers() {
    const securityHeaders = buildSecurityHeaders({
      isProd: process.env.NODE_ENV === "production",
      apiUrl: process.env.NEXT_PUBLIC_API_URL,
      posthogHost: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      sentryDsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      siteUrl:
        process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || undefined,
    });

    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

// const withNextIntl = createNextIntlPlugin()

export default withSentryConfig(nextConfig, {
  org: "foo",
  project: "monno",
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: false,
});
