/**
 * In-memory email branding (from name/address/support).
 * Loaded from Setting + env by EmailSettingsService; read sync by
 * templates and QueueService without Nest DI.
 */

export type EmailBranding = {
  fromName: string;
  fromEmail: string;
  supportEmail: string;
};

export const EMAIL_SETTING_KEYS = {
  fromName: 'EMAIL_FROM_NAME',
  fromEmail: 'EMAIL_FROM_EMAIL',
  supportEmail: 'EMAIL_SUPPORT_EMAIL',
} as const;

export function emailBrandingFromEnv(): EmailBranding {
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@resend.dev';
  const fromName = process.env.RESEND_FROM_NAME || 'Monno';
  return {
    fromName,
    fromEmail,
    supportEmail: process.env.RESEND_SUPPORT_EMAIL || fromEmail,
  };
}

let current: EmailBranding = emailBrandingFromEnv();

export function getEmailBranding(): EmailBranding {
  return current;
}

export function setEmailBranding(next: EmailBranding): void {
  current = next;
}
