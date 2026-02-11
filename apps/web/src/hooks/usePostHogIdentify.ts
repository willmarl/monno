import { useEffect } from "react";
import posthog from "posthog-js";
import { User } from "@/features/users/types/user";

/**
 * Hook to sync PostHog identification with your app's session
 * Call this once in a top-level component (e.g., layout or main page)
 *
 * Usage:
 * ```tsx
 * const { data: user } = useSessionUser();
 * usePostHogIdentify(user);
 * ```
 */
export function usePostHogIdentify(user: User | undefined) {
  useEffect(() => {
    if (user) {
      // User is logged in: identify them
      posthog.identify(String(user.id), {
        email: user.email ?? undefined,
        username: user.username,
        googleId: user.googleId ?? undefined,
        githubId: user.githubId ?? undefined,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      });
    } else {
      // User is logged out: reset
      posthog.reset();
    }
  }, [user?.id]); // Only re-run if user.id changes
}
