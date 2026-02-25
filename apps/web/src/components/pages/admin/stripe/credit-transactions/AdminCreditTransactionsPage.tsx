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
    <div>
      <CreditTransactionSearchBar basePath="/admin/credit-transactions" />
      <CreditTransactionsDataTable searchParams={searchParams} />
    </div>
  );
}
