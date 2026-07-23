"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSessionUser } from "@/features/auth/hooks";
import { useUpdatePreferences } from "@/features/preferences/hooks";
import { nextThemesToApi } from "@/features/preferences/types";

export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { data: user } = useSessionUser();
  const updatePrefs = useUpdatePreferences();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <Button variant="outline" size="icon" disabled />;
  }

  const current = theme === "system" ? resolvedTheme : theme;
  const nextLocal = current === "light" ? "dark" : "light";

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => {
        setTheme(nextLocal);
        if (user) {
          updatePrefs.mutate({ theme: nextThemesToApi(nextLocal) });
        }
      }}
    >
      {current === "light" ? (
        <Moon className="text-foreground" />
      ) : (
        <Sun className="text-foreground" />
      )}
    </Button>
  );
}
