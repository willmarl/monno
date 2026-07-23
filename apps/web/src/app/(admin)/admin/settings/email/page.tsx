import { AdminEmailSettingsPage } from "@/components/pages/admin/settings/AdminEmailSettingsPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Email settings",
};

export default function Page() {
  return <AdminEmailSettingsPage />;
}
