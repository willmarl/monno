import { AdminCreditPurchasesPage } from "@/components/pages/admin/stripe/credit-purchases/AdminCreditPurchasesPage";
import { AdminCreditPurchasesSearchParams } from "@/types/search-params";

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
