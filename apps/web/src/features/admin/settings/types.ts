export type EmailSettingsSource = "db" | "env";

export type EmailSettings = {
  fromName: string;
  fromEmail: string;
  supportEmail: string;
  envDefaults: {
    fromName: string;
    fromEmail: string;
    supportEmail: string;
  };
  source: {
    fromName: EmailSettingsSource;
    fromEmail: EmailSettingsSource;
    supportEmail: EmailSettingsSource;
  };
};

export type UpdateEmailSettingsInput = {
  fromName?: string;
  fromEmail?: string;
  supportEmail?: string;
};

export type EmailTestResult = {
  queued: boolean;
  to?: string;
  message?: string;
};

export type ComposeEmailAudience = "user" | "all";

export type ComposeEmailInput = {
  audience: ComposeEmailAudience;
  /** When audience=user: one separate outbound email per id (not CC). */
  userIds?: number[];
  subject: string;
  body: string;
  confirmBroadcast?: boolean;
};

export type ComposeEmailResult = {
  queued: number;
  skipped: number;
  audience: ComposeEmailAudience;
};
