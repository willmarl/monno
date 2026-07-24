import { useEffect } from "react";
import posthog from "posthog-js";
import { User } from "@/features/users/types/user";
import { identifyPostHogUser } from "@/lib/posthog-identify";

/**
 * Hook to sync PostHog identification with your app's session.
 * Prefer `<PostHogProvider>` in the tree; this exists for one-off use.
 *
 * Sends user id (+ role) only — no email, username, or OAuth IDs.
 */
export function usePostHogIdentify(user: User | undefined) {
  useEffect(() => {
    if (user) {
      identifyPostHogUser(user);
    } else {
      posthog.reset();
    }
  }, [user?.id, user?.role]);
}
