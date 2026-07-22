"use client";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { usePreferences, useUpdatePreferences } from "@/features/preferences/hooks";
import { useSessionUser } from "@/features/auth/hooks";

type ToggleKey =
  | "notifyInAppComments"
  | "notifyInAppLikes"
  | "notifyEmailComments"
  | "notifyEmailLikes";

const TOGGLES: { key: ToggleKey; label: string; description: string }[] = [
  {
    key: "notifyInAppComments",
    label: "In-app: comments",
    description: "Show a notification when someone comments on your content",
  },
  {
    key: "notifyInAppLikes",
    label: "In-app: likes",
    description: "Show a notification when someone likes your content",
  },
  {
    key: "notifyEmailComments",
    label: "Email: comments",
    description: "Email me when someone comments (verified email required)",
  },
  {
    key: "notifyEmailLikes",
    label: "Email: likes",
    description: "Email me when someone likes my content (verified email required)",
  },
];

export function NotificationsTab() {
  const { data: user } = useSessionUser();
  const { data: prefs, isLoading } = usePreferences(!!user);
  const updatePrefs = useUpdatePreferences();

  if (isLoading || !prefs) {
    return <p className="text-muted-foreground">Loading preferences…</p>;
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h2 className="text-xl font-semibold">Notifications</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Choose what you see in the bell and what we email you.
        </p>
      </div>

      <div className="space-y-4">
        {TOGGLES.map((t) => (
          <div
            key={t.key}
            className="flex items-start justify-between gap-4 py-3 border-b last:border-0"
          >
            <div className="space-y-1">
              <Label htmlFor={t.key}>{t.label}</Label>
              <p className="text-sm text-muted-foreground">{t.description}</p>
            </div>
            <Switch
              id={t.key}
              checked={!!prefs[t.key]}
              disabled={updatePrefs.isPending}
              onCheckedChange={(checked) =>
                updatePrefs.mutate({ [t.key]: checked })
              }
            />
          </div>
        ))}
      </div>
    </div>
  );
}
