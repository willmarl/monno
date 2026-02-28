import { AdminLogPage } from "@/components/pages/admin/logs/AdminLogPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Logs",
};
export default function page() {
  return <AdminLogPage />;
}
