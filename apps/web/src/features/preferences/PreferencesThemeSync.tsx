"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { useSessionUser } from "@/features/auth/hooks";
import { usePreferences } from "./hooks";
import { themeToNextThemes } from "./types";

/**
 * When logged in, apply server theme preference once prefs load.
 * Guests keep next-themes localStorage behavior.
 */
export function PreferencesThemeSync() {
  const { data: user } = useSessionUser();
  const { data: prefs } = usePreferences(!!user);
  const { setTheme, theme } = useTheme();
  const appliedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user || !prefs?.theme) return;
    const next = themeToNextThemes(prefs.theme);
    if (appliedRef.current === next && theme === next) return;
    appliedRef.current = next;
    if (theme !== next) {
      setTheme(next);
    }
  }, [user, prefs?.theme, setTheme, theme]);

  return null;
}
