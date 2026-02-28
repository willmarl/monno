import { requireAuth } from "@/features/auth/server";
import { ProfileSettingsLayout } from "@/components/pages/settings/ProfileSettingsLayout";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings",
};
export default async function profilePage() {
  const user = await requireAuth();

  return <ProfileSettingsLayout />;
}
