export type ThemePreference = "LIGHT" | "DARK" | "SYSTEM";

export type UserPreferences = {
  userId: number;
  theme: ThemePreference;
  layout: Record<string, unknown>;
  resume: Record<string, unknown>;
  onboarding: Record<string, unknown>;
  snoozes: Record<string, unknown>;
  notifyInAppComments: boolean;
  notifyInAppLikes: boolean;
  notifyEmailComments: boolean;
  notifyEmailLikes: boolean;
  createdAt: string;
  updatedAt: string;
};

export type UpdatePreferencesInput = {
  theme?: ThemePreference;
  layout?: Record<string, unknown>;
  resume?: Record<string, unknown>;
  onboarding?: Record<string, unknown>;
  snoozes?: Record<string, unknown>;
  notifyInAppComments?: boolean;
  notifyInAppLikes?: boolean;
  notifyEmailComments?: boolean;
  notifyEmailLikes?: boolean;
};

export function themeToNextThemes(theme: ThemePreference): string {
  switch (theme) {
    case "LIGHT":
      return "light";
    case "DARK":
      return "dark";
    default:
      return "system";
  }
}

export function nextThemesToApi(
  theme: string | undefined,
): ThemePreference {
  if (theme === "light") return "LIGHT";
  if (theme === "dark") return "DARK";
  return "SYSTEM";
}
