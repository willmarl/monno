import { CreditTransactionSearchBar } from "@/features/admin/stripe/components/CreditTransactionSearchBar";
import { CreditTransactionsDataTable } from "./CreditTransactionsDataTable";
import { AdminCreditTransactionsSearchParams } from "@/types/search-params";

interface AdminCreditTransactionsPageProps {
  searchParams?: AdminCreditTransactionsSearchParams;
}

export function AdminCreditTransactionsPage({
  searchParams,
}: AdminCreditTransactionsPageProps) {
  return (
    <div className="container mx-auto py-10 flex flex-col gap-4">
      <CreditTransactionSearchBar basePath="/admin/credit-transactions" />
      <CreditTransactionsDataTable searchParams={searchParams} />
    </div>
  );
}
