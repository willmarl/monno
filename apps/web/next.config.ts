import type { NextConfig } from "next";
// import createNextIntlPlugin from 'next-intl/plugin'
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  // Self-contained server bundle for Docker (node apps/web/server.js)
  output: "standalone",
};

// const withNextIntl = createNextIntlPlugin()

export default withSentryConfig(nextConfig, {
  org: "foo",
  project: "monno",
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: false,
});
