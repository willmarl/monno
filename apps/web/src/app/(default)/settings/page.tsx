import { requireAuth } from "@/features/auth/server";
import { ProfileSettingsLayout } from "@/components/pages/settings/ProfileSettingsLayout";

export default async function profilePage() {
  const user = await requireAuth();

  return <ProfileSettingsLayout />;
}
