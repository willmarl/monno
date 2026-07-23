import type { MetadataRoute } from "next";
import { serverApiUrl } from "@/lib/serverApiUrl";
import { getSiteUrl } from "@/lib/site-url";

type ApiList<T> = {
  success?: boolean;
  data?: {
    items?: T[];
    pageInfo?: { hasNext?: boolean; nextOffset?: number | null };
  };
};

type Listed = { id: number; updatedAt?: string };

const PAGE_SIZE = 100;
/** Cap so a huge DB cannot blow sitemap generation. */
const MAX_PAGES = 10;

async function fetchPublicIds(
  path: string,
): Promise<{ id: number; lastModified?: Date }[]> {
  const base = serverApiUrl().replace(/\/$/, "");
  const out: { id: number; lastModified?: Date }[] = [];

  for (let page = 0; page < MAX_PAGES; page++) {
    const offset = page * PAGE_SIZE;
    const url = `${base}${path}?limit=${PAGE_SIZE}&offset=${offset}`;

    try {
      const res = await fetch(url, {
        next: { revalidate: 3600 },
        headers: { Accept: "application/json" },
      });
      if (!res.ok) break;

      const json = (await res.json()) as ApiList<Listed>;
      const items = json.data?.items ?? [];
      for (const item of items) {
        out.push({
          id: item.id,
          lastModified: item.updatedAt ? new Date(item.updatedAt) : undefined,
        });
      }

      const hasNext = json.data?.pageInfo?.hasNext;
      if (!hasNext || items.length === 0) break;
    } catch {
      break;
    }
  }

  return out;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = getSiteUrl();
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: site, lastModified: now, changeFrequency: "daily", priority: 1 },
    {
      url: `${site}/post`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${site}/article`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${site}/collections`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.7,
    },
    {
      url: `${site}/users`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.5,
    },
    {
      url: `${site}/pricing`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  const [posts, articles, collections] = await Promise.all([
    fetchPublicIds("/posts"),
    fetchPublicIds("/articles"),
    fetchPublicIds("/collections"),
  ]);

  return [
    ...staticRoutes,
    ...posts.map((p) => ({
      url: `${site}/post/${p.id}`,
      lastModified: p.lastModified ?? now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...articles.map((a) => ({
      url: `${site}/article/${a.id}`,
      lastModified: a.lastModified ?? now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...collections.map((c) => ({
      url: `${site}/collection/${c.id}`,
      lastModified: c.lastModified ?? now,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}
