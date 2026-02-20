import { AdminCreditTransactionsPage } from "@/components/pages/admin/stripe/credit-transactions/AdminCreditTransactionsPage";
import { AdminCreditTransactionsSearchParams } from "@/types/search-params";

export default async function page({
  searchParams,
}: {
  searchParams: Promise<AdminCreditTransactionsSearchParams>;
}) {
  const params = await searchParams;
  return (
    <div>
      <AdminCreditTransactionsPage searchParams={params} />
    </div>
  );
}
