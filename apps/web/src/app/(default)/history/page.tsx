import { requireAuth } from "@/features/auth/server";
import { HistoryPage } from "@/components/pages/history/HistoryPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "History",
};

export default async function page() {
  await requireAuth();
  return <HistoryPage />;
}
