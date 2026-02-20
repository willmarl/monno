import { PurchasesPage } from "@/components/pages/purchases/PurchasesPage";
import { requireAuth } from "@/features/auth/server";

export default async function page() {
  const user = await requireAuth();

  return <PurchasesPage />;
}
