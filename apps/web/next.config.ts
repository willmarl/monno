import type { NextConfig } from "next";
// import createNextIntlPlugin from 'next-intl/plugin'
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  /* config options here */
};

// const withNextIntl = createNextIntlPlugin()

export default withSentryConfig(nextConfig, {
  org: "foo",
  project: "monno",
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: false,
});
