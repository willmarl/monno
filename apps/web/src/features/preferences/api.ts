import { fetcher } from "@/lib/fetcher";
import type { UpdatePreferencesInput, UserPreferences } from "./types";

export const fetchPreferences = () =>
  fetcher<UserPreferences>("/users/me/preferences", { method: "GET" });

export const updatePreferences = (data: UpdatePreferencesInput) =>
  fetcher<UserPreferences>("/users/me/preferences", {
    method: "PATCH",
    json: data,
  });
