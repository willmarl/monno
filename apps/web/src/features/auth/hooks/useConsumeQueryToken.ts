"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * Read a one-time secret from the query string, then remove it from the URL
 * (history + address bar) so it is less likely to leak via Referer or screenshots.
 * Email links still use `?token=…`; the token is kept in React state for the page.
 */
export function useConsumeQueryToken(param = "token"): string | null {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [token] = useState(() => searchParams.get(param));

  useEffect(() => {
    if (!searchParams.has(param)) return;

    const next = new URLSearchParams(searchParams.toString());
    next.delete(param);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [param, pathname, router, searchParams]);

  return token;
}
