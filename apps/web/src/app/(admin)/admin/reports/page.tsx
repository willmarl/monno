import { AdminReportsPage } from "@/components/pages/admin/reports/AdminReportsPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reports",
};

export default function page() {
  return <AdminReportsPage />;
}
