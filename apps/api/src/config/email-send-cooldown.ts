/**
 * Per-recipient cooldown for outbound auth emails (Resend cost / spam).
 * Complements Nest @Throttle (IP-based) which alone can be rotated around.
 */
export const emailSendCooldownMs = () =>
  parseInt(process.env.EMAIL_SEND_COOLDOWN_MS || '60000', 10);

export function emailSendCooldownCutoff(now = new Date()): Date {
  return new Date(now.getTime() - emailSendCooldownMs());
}
