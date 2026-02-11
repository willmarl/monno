import posthog from "posthog-js";

/**
 * Custom hook for tracking PostHog events throughout the app
 *
 * Usage:
 * ```tsx
 * const { captureEvent } = usePostHogEvents();
 *
 * const handleSignup = async () => {
 *   // ... signup logic
 *   captureEvent("signup_completed", { plan: "free" });
 * };
 * ```
 */
export function usePostHogEvents() {
  const captureEvent = (
    eventName: string,
    properties?: Record<string, any>,
  ) => {
    posthog.capture(eventName, properties);
  };

  return { captureEvent };
}
