import { PurchasesPage } from "@/components/pages/purchases/PurchasesPage";
import { requireAuth } from "@/features/auth/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Purchases",
};
export default async function page() {
  const user = await requireAuth();

  return <PurchasesPage />;
}
