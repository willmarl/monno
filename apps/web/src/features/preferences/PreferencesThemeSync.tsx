"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { useSessionUser } from "@/features/auth/hooks";
import { usePreferences } from "./hooks";
import { themeToNextThemes } from "./types";

/**
 * When logged in, apply server theme preference when prefs load / change.
 * Guests keep next-themes localStorage behavior.
 *
 * Important: do NOT depend on local `theme` — otherwise toggling
 * setTheme() before the PATCH lands makes this effect re-apply the
 * stale server value and fight the toggle (flash / loop).
 */
export function PreferencesThemeSync() {
  const { data: user } = useSessionUser();
  const { data: prefs } = usePreferences(!!user);
  const { setTheme } = useTheme();
  const appliedServerThemeRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user) {
      appliedServerThemeRef.current = null;
      return;
    }
    if (!prefs?.theme) return;

    const next = themeToNextThemes(prefs.theme);
    if (appliedServerThemeRef.current === next) return;
    appliedServerThemeRef.current = next;
    setTheme(next);
  }, [user, prefs?.theme, setTheme]);

  return null;
}
