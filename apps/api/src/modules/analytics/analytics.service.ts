import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);
  private readonly host = process.env.POSTHOG_HOST;
  private readonly apiKey = process.env.POSTHOG_PROJECT_API_KEY;

  /**
   * Capture an event to PostHog
   * Should be called for critical business events that must not be lost
   * (e.g., payments, webhooks, admin actions)
   */
  async capture(
    distinctId: string,
    eventName: string,
    data?: Record<string, any>,
  ): Promise<void> {
    // Silently skip if PostHog not configured
    if (!this.host || !this.apiKey) {
      return;
    }

    try {
      const response = await fetch(`${this.host}/i/v0/e/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: this.apiKey,
          event: eventName,
          distinct_id: distinctId,
          properties: data || {},
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        this.logger.warn(
          `PostHog event capture failed: ${eventName} (status: ${response.status})`,
        );
      }
    } catch (error) {
      // Silently fail - don't break user flow if PostHog is down
      this.logger.error(
        `PostHog event capture error: ${eventName}`,
        error instanceof Error ? error.message : String(error),
      );
    }
  }
}
