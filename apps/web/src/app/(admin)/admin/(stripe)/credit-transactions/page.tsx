import { AdminCreditTransactionsPage } from "@/components/pages/admin/stripe/credit-transactions/AdminCreditTransactionsPage";
import { AdminCreditTransactionsSearchParams } from "@/types/search-params";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Credit Transactions",
};
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
