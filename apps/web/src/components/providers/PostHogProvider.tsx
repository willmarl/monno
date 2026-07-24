"use client";

import { useEffect } from "react";
import posthog from "posthog-js";
import { useSessionUser } from "@/features/auth/hooks";
import { identifyPostHogUser } from "@/lib/posthog-identify";

/**
 * Syncs PostHog identity with the session (id + role only; no email/OAuth IDs).
 * Must be used inside QueryClientProvider.
 */
export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const { data: user } = useSessionUser();

  useEffect(() => {
    if (user) {
      identifyPostHogUser(user);
    } else {
      posthog.reset();
    }
  }, [user?.id, user?.role]);

  return <>{children}</>;
}
