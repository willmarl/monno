import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

/**
 * Crawl rules for search engines.
 * Private / auth / admin surfaces are disallowed; public content stays open.
 */
export default function robots(): MetadataRoute.Robots {
  const site = getSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/",
          "/settings",
          "/notifications",
          "/history",
          "/checkout",
          "/purchases",
          "/unauthorized",
          "/test",
          "/login",
          "/register",
          "/forgot-password",
          "/reset-password",
          "/verify-email",
          "/success",
          "/post/create",
          "/post/edit",
          "/article/create",
          "/article/edit",
        ],
      },
    ],
    sitemap: `${site}/sitemap.xml`,
  };
}
