import posthog from "posthog-js";

/**
 * Identify the current user in PostHog without sending PII
 * (email, OAuth provider IDs, username). Distinct id is the app user id.
 */
export function identifyPostHogUser(user: {
  id: number;
  role?: string;
}): void {
  posthog.identify(String(user.id), {
    role: user.role,
  });
}
