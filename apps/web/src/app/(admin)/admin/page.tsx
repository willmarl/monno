import { AdminDashboardPage } from "@/components/pages/admin/dashboard/AdminDashboardPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "Admin Dashboard" },
};
export default function page() {
  return (
    <div>
      <AdminDashboardPage />
    </div>
  );
}
