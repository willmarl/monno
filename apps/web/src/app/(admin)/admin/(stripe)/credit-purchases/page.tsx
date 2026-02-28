import { AdminCreditPurchasesPage } from "@/components/pages/admin/stripe/credit-purchases/AdminCreditPurchasesPage";
import { AdminCreditPurchasesSearchParams } from "@/types/search-params";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Credit Purchases",
};
export default async function page({
  searchParams,
}: {
  searchParams: Promise<AdminCreditPurchasesSearchParams>;
}) {
  const params = await searchParams;
  return (
    <div>
      <AdminCreditPurchasesPage searchParams={params} />
    </div>
  );
}
