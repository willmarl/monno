import { requireAuth } from "@/features/auth/server";
import { ProfileSettingsLayout } from "@/components/pages/profile/ProfileSettingsLayout";

export default async function profilePage() {
  const user = await requireAuth();

  return <ProfileSettingsLayout />;
}
