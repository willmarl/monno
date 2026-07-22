import { requireAuth } from "@/features/auth/server";
import { NotificationsPage } from "@/components/pages/notifications/NotificationsPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Notifications",
};

export default async function page() {
  await requireAuth();
  return <NotificationsPage />;
}
