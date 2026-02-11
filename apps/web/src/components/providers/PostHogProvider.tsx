"use client";

import { useEffect } from "react";
import posthog from "posthog-js";
import { useSessionUser } from "@/features/auth/hooks";

/**
 * PostHog provider component that handles user identification
 * - Identifies users when they log in
 * - Resets identification when they log out
 *
 * Must be used inside QueryClientProvider (for useSessionUser)
 */
export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const { data: user } = useSessionUser();

  useEffect(() => {
    if (user) {
      // User is logged in: identify them with PostHog
      posthog.identify(String(user.id), {
        email: user.email ?? undefined,
        username: user.username,
        googleId: user.googleId ?? undefined,
        githubId: user.githubId ?? undefined,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      });
    } else {
      // User is logged out: reset PostHog
      posthog.reset();
    }
  }, [user?.id]);

  return <>{children}</>;
}
